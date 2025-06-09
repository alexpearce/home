---
title: Daikin heat pump WiFi woes
date: 2025-06-09
tags: [Tips, sysadmin]
description: Troubleshooting WiFi connection problems with the Daikin Altherma MMI and Onecta app, ultimately due to WPA3 incompatibility.
---

**TL;DR**: The [Daikin Altherma][altherma] control box cannot connect to WiFi networks which use WPA3 or transitional WPA2/WP3, nor those using 5 GHz exclusively.
You must connect it to a WPA2 or WPA/WPA2 2.4 GHz WiFi network.
Once it is connected to the internet you do not need to be on the same WiFi network to control it via the Daikin Onecta app.
Creating a Daikin-specific network may be an option if you do not want to compromise your main network.

---

Some Daikin heat pumps can be controlled by a 'man-machine interface' (MMI) unit.[^1]
This is a little black box with a screen that's attached to an internal wall, letting you monitor and change things like water temperature and heating schedules.

The [Daikin Onecta app][onecta] lets you do most of the stuff you can do with the MMI from the comfort of your phone.
But first you have to go through the 'add device' process on the app.

Here how the setup process is supposed to go:

1. You begin the 'add device' process from the Onecta app.
2. The app guides you through the steps to enable access point (AP) mode on the MMI. The MMI creates a WiFi network, probably called `daikin-ap`.
3. The app configures your phone to join the MMI's WiFi network.
4. Your phone and the MMI are now on the same network. This means the app can communicate with the MMI.
5. The app detects WiFi networks in your area and asks you to choose which WiFi network the MMI should connect to. It will ask for the password for that network. You will probably chose your main home WiFi network.
6. The app will send the WiFi network details you provided to the MMI.
7. The MMI will attempt to connect to the WiFi network you specified.
8. The app will request that your phone joins the WiFi network you specified.
9. Your phone and the MMI are now on the same network again, but now the network is the one you specified, not the one created temporarily by the MMI.
10. The app will send the MMI some details about your Onecta account and the 'home' you're setting up.
11. The MMI will connect to Daikin servers over the internet to register itself to your account and your 'home'.

Once step 11 is complete, the MMI can be controlled via the Onecta app.
Note that control is done via Daikin's 'cloud' servers, **not directly over your chosen WiFi network**.

There are several things which can go wrong. I experienced a couple:

- Whilst your phone is connected to the MMI AP network, your phone detects that this WiFi network does not provide internet access and so switches back to a known-good network. This may interrupt steps 4–6 above.
- The app fails to connect to the MMI after sending WiFi credentials over to it.

The first issue is a nuisance but can be navigated by periodically checking the WiFi network your phone is connected to during steps 4–6.

The second issue can be a royal pain because neither the app nor the MMI offer much advice on _why_ the MMI cannot be reached.
In principle it could be a firewall configuration on your router but this is unlikely.
It could also be because your own wireless access point (or your ISP's combination router/WAP) does not support or is otherwise mangling [mDNS] packets, but again that is unlikely.[^2]

More likely is that the MMI could not connect to the WiFi network you specified in the first place, i.e. step 7 failed.
You can check this by navigating to 'Wireless gateway' → 'Home network connection' on the MMI: if is says "Disconnected from `CHOSEN_NETWORK`" then the MMI could not connect.
Perhaps you entered the password wrong on the app.
Or perhaps your chosen WiFi network does not meet a couple of hard-to-discover compatibility requirements:

- Your WiFi network [must support 2.4 GHz](https://www.daikin.eu/en_us/faq/my-network-is-not-visible-in-the-network-dropdown-list.html).
- Your WiFi network [must support WPA, WPA2, or WPA/WPA2 encryption](https://www.daikin.co.uk/en_gb/faq/i-do-not-succeed-in-connecting-the-adapter-to-the-wireless-network-by-using-the-wlan-settings-menu.html). Using WPA3 or WPA2/WPA3 is not supported.[^3]

You must either create a WiFi network that meets these compatibility requirements and choose that network during the setup process, or permanently downgrade your WiFi network to support the MMI.

I have a wireless access point that supports serving multiple wireless networks and so chose the former option.

If you choose to make a separate network, you will likely not want your phone to be on that network after the setup process, otherwise it may not be able to access devices on your regular home network.

Thankfully, once the setup process is complete, having the MMI on a seperate WiFi network to your phone does _not_ prevent the Onecta app from controlling the MMI.
The Onecta app communicates with Daikin cloud over the internet, and the MMI also communicates with Daikin cloud over the internet.
The Onecta app _does not_ communicate with the MMI over the local WiFi network except during the setup process.

So after the setup process you can connect your phone back to your usual home network, use the Onecta app, and try to forget that 'smart devices' exist.

[^1]: Such an awful name!
[^2]: I could not confirm it but I _think_ the app discovers the MMI on your chosen WiFi network by using [the `altherma.local` address](https://www.daikin.co.uk/en_gb/faq/http---altherma-local--the-link-to-the-network-gateways-configur.html), which is configured by mDNS.
[^3]: I cannot find a reference for why transitional WPA2/WPA3 would not work given that WPA2 is supposedly supported.

[altherma]: https://www.daikin.co.uk/en_gb/residential/products-and-advice/product-categories/heat-pumps/air-to-water-heat-pumps/daikin-altherma-3-m.html
[onecta]: https://www.daikin.co.uk/en_gb/residential/products-and-advice/product-categories/controllers/onecta.html
[mdns]: https://en.wikipedia.org/wiki/Multicast_DNS
