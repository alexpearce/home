---
title: "TIL: FastAPI, OpenAPI, and Bearer token authentication"
date: 2022-06-17
tags: [TIL, Python, FastAPI]
description: How to add idiomatic support for Bearer token authentication in FastAPI's generated OpenAPI specification.
---

The Python web framework [FastAPI][fastapi] generates an [OpenAPI][openapi]
description of your endpoints [automatically][fastapi-openapi], making them
available under the `/docs` path of your site.

For example this application:

```python
from fastapi import FastAPI


app = FastAPI()


@app.get("/", response_model=str)
async def index():
    return "Hello, world!"
```

results in this documentation:

![Swagger UI page for a simple FastAPI application.](/img/fastapi-openapi-bearer-token/openapi-index.png)

FastAPI uses the information declared on the endpoint function, `index` in this
case, to generate the OpenAPI specification data including:

- Description (from the function's docstring).
- HTTP method.
- URL parameters.
- Request and response schemas (converted to JSON from their Python representations).

Including an OpenAPI specification, and presenting the associated [Swagger
UI][swagger-ui] shown above, is helpful for several reasons.

- It gives users of your API an idea of what's available and how to use it.
- It provides a "try it out" button so users can run requests against the API
  interactively, inserting parameter and request schema values via text fields
  and seeing the response code and text reported back.
- Developers and third-party tools can use the specification to generate API
  clients or their own versions of the documentation.

The OpenAPI specification [supports describing required
authentication][openapi-auth] for given endpoints, but it's not obvious how to
add support for this in all cases to your FastAPI application such that it
appears in the Swagger UI.

## Bearer token authentication

I was working on a FastAPI site recently which used [Bearer token
authentication][bearer]. This requires an HTTP header containing an API token,
which we can then use to look up users in a database and granting or denying
access accordingly. It takes the form

```
Authorization: Bearer api_token_abc123
```

A naive implementation of this might use [FastAPI's `Header` dependency
support][fastapi-header] to retrieve the header value.

```python
from fastapi import Depends, Header, HTTPException
from pydantic import BaseModel
from starlette import status


# Placeholder for a database containing valid token values
known_tokens = set(["api_token_abc123"])


class UnauthorizedMessage(BaseModel):
    detail: str = "Bearer token missing or unknown"


async def get_token(
    authorization: str = Header(default="Bearer "),
) -> str:
    _, token = authorization.split(" ")
    # Simulate a database query to find a known token
    if token not in known_tokens:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=UnauthorizedMessage().detail,
        )
    return token


@app.get(
    "/protected",
    response_model=str,
    responses={status.HTTP_401_UNAUTHORIZED: dict(model=UnauthorizedMessage)},
)
async def protected(token: str = Depends(get_token)):
    return f"Hello, user! Your token is {token}."
```

We can make requests to this protected endpoint using the documentation:

![Swagger UI page showing an endpoint which accepts an Authorization header.](/img/fastapi-openapi-bearer-token/openapi-header-request.png)

But there are a couple of ugly features:

1. The user must take care to ensure the header value starts with `Bearer `.
2. Our application has to parse the `Authorization` header manually. Indeed we
   haven't done a very thorough job in the example, as for example the
   `authorization.split(" ")` call will fail if the header value doesn't
   contain a space.
3. OpenAPI [supports authorisation
   explicitly](https://swagger.io/docs/specification/authentication/), but in
   our documentation it's obscured behind some header value.

[FastAPI supports semantic authorisation][fastapi-auth] but the documentation
doesn't make it clear how to add simple `Bearer` token support. Luckily it is
indeed simple enough.

```python
import typing as t

from fastapi.security.http import HTTPAuthorizationCredentials, HTTPBearer


# We will handle a missing token ourselves
get_bearer_token = HTTPBearer(auto_error=False)


async def get_token(
    auth: t.Optional[HTTPAuthorizationCredentials] = Depends(get_bearer_token),
) -> str:
    # Simulate a database query to find a known token
    if auth is None or (token := auth.credentials) not in known_tokens:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=UnauthorizedMessage().detail,
        )
    return token
```

Now the documentation shows a little lock icon next to our protected endpoint:

![Swagger UI page showing explicit support for authentication.](/img/fastapi-openapi-bearer-token/openapi-bearer-index.png)

We can click on the "Authorize" button in the top right and enter a token value.

![Swagger UI page showing an authorisation modal.](/img/fastapi-openapi-bearer-token/openapi-bearer-value.png)

Finally we can see the request was successfully authentication, meaning our
application received the token value, all without having to parse the
`Authorization` header manually!

The full source code for the final application is [available as a gist][gist].

![Swagger UI page showing a successfully authorised request.](/img/fastapi-openapi-bearer-token/openapi-bearer-request.png)

[fastapi]: https://fastapi.tiangolo.com
[openapi]: https://swagger.io/specification/
[fastapi-openapi]: https://fastapi.tiangolo.com/features/#automatic-docs
[swagger-ui]: https://swagger.io/tools/swagger-ui/
[openapi-auth]: https://swagger.io/docs/specification/authentication/
[fastapi-header]: https://fastapi.tiangolo.com/tutorial/header-params/
[bearer]: https://swagger.io/docs/specification/authentication/bearer-authentication/
[fastapi-auth]: https://fastapi.tiangolo.com/tutorial/security/
[gist]: https://gist.github.com/alexpearce/73700474d8be770c0e5448cb09d885cb
