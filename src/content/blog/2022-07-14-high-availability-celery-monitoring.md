---
title: High-availability real-time Celery monitoring
date: 2022-07-14
tags: [Tips, Python, Celery]
description: A guide on creating multiple Celery event receivers for highly available real-time worker and task monitoring.
---

If you want real-time monitoring of what your [Celery][celery] workers and tasks
are up to, Celery's [`EventReceiver`][eventreceiver] is the tool for the
job.[^1]

The [example from the real-time monitoring documentation][celery-real-time]
tells us most of what we need to know if we want to make our own receiver:

```python
from celery import Celery


def my_monitor(app):
    state = app.events.State()

    def announce_failed_tasks(event):
        state.event(event)
        # task name is sent only with -received event, and state
        # will keep track of this for us.
        task = state.tasks.get(event["uuid"])

        print(
            "TASK FAILED: %s[%s] %s"
            % (
                task.name,
                task.uuid,
                task.info(),
            )
        )

    with app.connection() as connection:
        recv = app.events.Receiver(
            connection,
            handlers={
                "task-failed": announce_failed_tasks,
                "*": state.event,
            },
        )
        recv.capture(limit=None, timeout=None, wakeup=True)


if __name__ == "__main__":
    app = Celery(broker="amqp://guest@localhost//")
    my_monitor(app)
```

(The [`app.events.Receiver`][appreceiver] here is a wrapper around the
`EventReceiver` which passes in the associated `app` instance.)

If our application relies on strong guarantees about message delivery, we would
like to run multiple instances of the receiver in case one or more of them
fails. We then hope that the remaining instances can pick up the slack until the
other instances come back online.

However, if we run multiple instances of the example above we'll see that
_every_ receiver processes _all_ messages! We could try to handle this
duplication within our application, but there's a better way. It's wonderfully
simple.

```diff
 recv = app.events.Receiver(
     connection,
     handlers={
         "task-failed": announce_failed_tasks,
         "*": state.event,
     },
+    node_id="app_event_receiver",
 )
```

Yeah! With the addition of the `node_id` argument each receiver will consume
messages from the events queue in a round-robin fashion. We can spin up multiple
receiver instances without fear of processing the same message twice.

That's pretty much the crux of this post! With all credit and thanks to
m'colleague [Neil Wang][neil] for uncovering this beautifully minimal solution
to a niggling problem we had at work.

You can check out [`high-availability-celery-monitor`
repository][high-availability-celery-monitor] for a complete example Celery
application which demonstrates the effect of setting `node_id` with multiple
event receiver instances.

To understand why setting this argument addresses our needs we need to know a
little bit about how the broker works.

## Brokers, exchanges, queues, and consumers

We'll focus on AMQP brokers here, using the language from [RabbitMQ's AMQP-0-9-1
documentation][rabbitmq-amqp]. In principle Celery should support the behaviour
above with any broker, but some [such as Redis][redis-events] may not provide
the same guarantees as dedicated AMQP brokers.[^2] Check your broker's documentation
to be sure!

When the `EventReceiver` starts it registers itself with the broker as a
consumer of a specific _queue_.  Celery worker instances and the tasks they
execute push status updates, 'events', to an _exchange_ that queue is _bound_
to. The information flow goes worker → exchange → queue → consumer.

![Schematic of RabbitMQ's message passing flow from producer to consumer.](/img/high-availability-celery-monitoring/message_flow.svg)

Upon popping an event message off the queue a receiver will dispatch it to a
Python function based on the event's type (e.g. `worker-online` or
`task-failed`). The receiver's `handlers` dictionary defines the mapping between
event type and Python function handler.

![Schematic of the Celery event receiver's handler dispatch logic.](/img/high-availability-celery-monitoring/receiver-handler-dispatch.svg)

By default an `EventReceiver` [creates a queue whose name is randomly
generated][celery-receiver-queue-uuid] on instantiation. That queue is bound to
an [exchange][celery-receiver-exchange] with the [fixed name][celery-events-exchange]
`celeryev` of the ['topic' type][topic-exchange].

By instantiating multiple `EventReceiver` objects with the default settings,
each receiver will create on their own uniquely named queue, bound to a common
exchange.  As the exchange type is 'topic' and [Celery creates each
queue][routing_key] with the [catch-all routing key '`#`'][topic-routing], each
receiver will process all messages. The topic exchange 'multicasts' each message
to all receiver queues.

![Schematic of the event message flow using Celery's default event receiver configuration.](/img/high-availability-celery-monitoring/celery_event_queues.svg)

To have each message be processed exclusively by a single receiver, we just need
to have all receivers _listen to the same queue_.

![Schematic of the event message flow using the event receiver configuration shown in this post.](/img/high-availability-celery-monitoring/celery_event_queue.svg)

Specifying the `node_id` argument in the `EventReceiver` constructor results in
all receivers [creating a queue with the same name ][queue_name]. Upon binding
this queue to the `celeryev` exchange the broker will de-duplicate the queues by
name, resulting in a single queue being bound. The broker will then take care of
distributing events to consumers of the queue in a round-robin fashion.

With an understanding of AMQP exchanges, queues, and consumers, and an
understanding of how Celery's events system uses these components, our solution
might now seem pretty obvious! It can take time to understand a system, and
often it doesn't feel necessary to do so when you want to get up and running
quickly. Taking the time can yield many benefits.

## Dropped messages

By default the messages sent to the events exchange have [a time-to-live of 5
seconds][queue_message_ttl]. This stops the event queues from filling up
indefinitely, but introduces the possibility of event messages being missed
(i.e. if no receiver pops a given message off the queue before the TTL).

Increasing the number of receiver instances and reducing the runtime of your
receiver's event processing logic will reduce the chances of a message being
dropped before they can be processed. Increasing the TTL will do the same,
although if you're unable to process events within 5 seconds it might be worth
reconsidering if real-time monitoring is necessary for your system.

What happens in a receiver goes offline while it is processing an event message?
It is lost forever. As far as I can tell Celery never acknowledges the messages
it pulls from the event queue and so the broker will drop them after the TTL.
From the broker's point of view the first receiver has consumed the message, and
so it will not try to distribute it to another receiver.

So, even though our solution helps protect us against a single point of failure,
it is not bullet proof. If you absolutely, positively _must_ know about every
single event then you should make further considerations:

1. Make the events receiver as simple and robust as possible to minimise the
   potential for processing failures, e.g. push event payloads verbatim into a database.
2. Figure out if you can detect when a message may have been dropped (e.g. your
   task state DB has an entry stuck in 'running' for much longer than is normal) and then try to recover the lost information based on the current state of the system.

As ever, these distributed systems offer plenty of opportunity for generating
exciting edge cases!

[celery]: https://docs.celeryq.dev/en/stable/index.html
[celery-real-time]: https://docs.celeryq.dev/en/stable/userguide/monitoring.html#real-time-processing
[eventreceiver]: https://docs.celeryq.dev/en/stable/reference/celery.events.receiver.html
[flower]: https://github.com/mher/flower
[clearly]: https://github.com/rsalmei/clearly
[rabbitmq-amqp]: https://www.rabbitmq.com/tutorials/amqp-concepts.html
[redis-events]: https://github.com/celery/celery/issues/5317
[celery-receiver-queue-uuid]: https://github.com/celery/celery/blob/ec3714edf37e773ca5372f71f7f4ee5b1b33dd5d/celery/events/receiver.py#L42
[celery-receiver-exchange]: https://github.com/celery/celery/blob/ec3714edf37e773ca5372f71f7f4ee5b1b33dd5d/celery/events/receiver.py#L44-L46
[celery-events-exchange]: https://github.com/celery/celery/blob/8ebcce1523d79039f23da748f00bec465951de2a/celery/events/event.py#L11-L15
[appreceiver]: https://github.com/celery/celery/blob/ec3714edf37e773ca5372f71f7f4ee5b1b33dd5d/celery/app/events.py#L17-L20
[topic-exchange]: https://www.rabbitmq.com/tutorials/amqp-concepts.html#exchange-topic
[topic-routing]: https://www.rabbitmq.com/tutorials/tutorial-five-python.html
[queue_name]: https://github.com/celery/celery/blob/ec3714edf37e773ca5372f71f7f4ee5b1b33dd5d/celery/events/receiver.py#L52
[routing_key]: https://github.com/celery/celery/blob/ec3714edf37e773ca5372f71f7f4ee5b1b33dd5d/celery/events/receiver.py#L35
[neil]: https://github.com/isNeil
[queue_message_ttl]: https://docs.celeryq.dev/en/stable/userguide/configuration.html?highlight=heartbeat#event-queue-ttl
[high-availability-celery-monitor]: https://github.com/alexpearce/high-availability-celery-monitor

[^1]: This is how tools like [Flower][flower] and [Clearly][clearly] listen to
      Celery events for creating pretty monitoring dashboards.
[^2]: So just use RabbitMQ!
