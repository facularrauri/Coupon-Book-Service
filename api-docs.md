---
title: API v1.0.0
language_tabs:
  - shell: cURL
language_clients:
  - shell: ""
toc_footers:
  - <a href="/swagger.json">swagger.json</a>
includes: []
search: true
highlight_theme: darkula
headingLevel: 2

---

<!-- Generator: Widdershins v4.0.1 -->

<h1 id="api">API v1.0.0</h1>

> Scroll down for code samples, example requests and responses. Select a language for code samples from the tabs above or the mobile navigation menu.

API documentation for endpoints

Base URLs:

* <a href="http://localhost:3000">http://localhost:3000</a>

# Authentication

- HTTP Authentication, scheme: bearer 

<h1 id="api-auth">Auth</h1>

Authentication endpoints

## post__auth_token

> Code samples

```shell
# You can also use wget
curl -X POST http://localhost:3000/auth/token \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer {access-token}'

```

`POST /auth/token`

*Login user and get JWT token*

> Body parameter

```json
{
  "email": "user@example.com",
  "password": "stringst"
}
```

<h3 id="post__auth_token-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[LoginDTO](#schemalogindto)|true|none|

<h3 id="post__auth_token-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful login|None|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Invalid credentials|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|User not found|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
BearerAuth
</aside>

<h1 id="api-coupon-book">Coupon Book</h1>

Coupon Book management endpoints

## post__coupons

> Code samples

```shell
# You can also use wget
curl -X POST http://localhost:3000/coupons \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer {access-token}'

```

`POST /coupons`

*Create a Coupon Book*

> Body parameter

```json
{
  "name": "string",
  "description": "string",
  "startDate": "string",
  "endDate": "string",
  "isActive": true,
  "maxRedemptionsPerUser": 0,
  "maxCodesPerUsers": 0,
  "allowMultipleRedemptions": true,
  "codePattern": "string"
}
```

<h3 id="post__coupons-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[CreateCouponBookDTO](#schemacreatecouponbookdto)|true|none|

<h3 id="post__coupons-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|201|[Created](https://tools.ietf.org/html/rfc7231#section-6.3.2)|Coupon Book created successfully|None|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad request|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
BearerAuth
</aside>

## post__coupons_random-codes

> Code samples

```shell
# You can also use wget
curl -X POST http://localhost:3000/coupons/random-codes \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer {access-token}'

```

`POST /coupons/random-codes`

*Generate coupons for book*

> Body parameter

```json
{
  "quantity": 1,
  "couponBookId": "string"
}
```

<h3 id="post__coupons_random-codes-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[GenerateCodesDTO](#schemageneratecodesdto)|true|none|

<h3 id="post__coupons_random-codes-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|201|[Created](https://tools.ietf.org/html/rfc7231#section-6.3.2)|Coupon Book created successfully|None|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad request|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
BearerAuth
</aside>

## post__coupons_codes

> Code samples

```shell
# You can also use wget
curl -X POST http://localhost:3000/coupons/codes \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer {access-token}'

```

`POST /coupons/codes`

*Upload coupons for book*

> Body parameter

```json
{
  "codes": [
    null
  ],
  "couponBookId": "string"
}
```

<h3 id="post__coupons_codes-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[UploadCouponsDTO](#schemauploadcouponsdto)|true|none|

<h3 id="post__coupons_codes-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|201|[Created](https://tools.ietf.org/html/rfc7231#section-6.3.2)|Coupons upload successfully|None|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad request|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
BearerAuth
</aside>

<h1 id="api-coupons">Coupons</h1>

Coupons management endpoints

## post__coupons_assign

> Code samples

```shell
# You can also use wget
curl -X POST http://localhost:3000/coupons/assign \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer {access-token}'

```

`POST /coupons/assign`

*Assign random coupon to user*

> Body parameter

```json
{
  "userId": "string",
  "couponBookId": "string"
}
```

<h3 id="post__coupons_assign-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[AssignRandomCouponDTO](#schemaassignrandomcoupondto)|true|none|

<h3 id="post__coupons_assign-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|201|[Created](https://tools.ietf.org/html/rfc7231#section-6.3.2)|Coupon assigned successfully|None|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad request|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
BearerAuth
</aside>

## post__coupons_assign_{code}

> Code samples

```shell
# You can also use wget
curl -X POST http://localhost:3000/coupons/assign/{code} \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer {access-token}'

```

`POST /coupons/assign/{code}`

*Assign coupon to user*

> Body parameter

```json
{
  "userId": "string"
}
```

<h3 id="post__coupons_assign_{code}-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|code|path|string|true|Coupon code|
|body|body|[AssignCouponDTO](#schemaassigncoupondto)|true|none|

<h3 id="post__coupons_assign_{code}-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|201|[Created](https://tools.ietf.org/html/rfc7231#section-6.3.2)|Coupon assigned successfully|None|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad request|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
BearerAuth
</aside>

## post__coupons_lock_{code}

> Code samples

```shell
# You can also use wget
curl -X POST http://localhost:3000/coupons/lock/{code} \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer {access-token}'

```

`POST /coupons/lock/{code}`

*Lock a coupon for redemption*

> Body parameter

```json
{
  "userId": "string"
}
```

<h3 id="post__coupons_lock_{code}-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|code|path|string|true|Coupon code|
|body|body|[LockCouponDTO](#schemalockcoupondto)|true|none|

<h3 id="post__coupons_lock_{code}-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|201|[Created](https://tools.ietf.org/html/rfc7231#section-6.3.2)|Coupon locked successfully|None|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad request|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
BearerAuth
</aside>

## post__coupons_redeem_{code}

> Code samples

```shell
# You can also use wget
curl -X POST http://localhost:3000/coupons/redeem/{code} \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer {access-token}'

```

`POST /coupons/redeem/{code}`

*redeem a coupon*

> Body parameter

```json
{
  "userId": "string"
}
```

<h3 id="post__coupons_redeem_{code}-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|code|path|string|true|Coupon code|
|body|body|[AssignCouponDTO](#schemaassigncoupondto)|true|none|

<h3 id="post__coupons_redeem_{code}-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|201|[Created](https://tools.ietf.org/html/rfc7231#section-6.3.2)|Coupon locked successfully|None|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad request|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
BearerAuth
</aside>

## get__coupons_user_{id}

> Code samples

```shell
# You can also use wget
curl -X GET http://localhost:3000/coupons/user/{id} \
  -H 'Authorization: Bearer {access-token}'

```

`GET /coupons/user/{id}`

*Return coupons assigned to user*

<h3 id="get__coupons_user_{id}-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|string|true|User id|

<h3 id="get__coupons_user_{id}-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|201|[Created](https://tools.ietf.org/html/rfc7231#section-6.3.2)|Coupon locked successfully|None|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad request|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
BearerAuth
</aside>

<h1 id="api-users">Users</h1>

User management endpoints

## post__users

> Code samples

```shell
# You can also use wget
curl -X POST http://localhost:3000/users \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer {access-token}'

```

`POST /users`

*Create a user*

> Body parameter

```json
{
  "firstName": "string",
  "lastName": "string",
  "email": "user@example.com",
  "password": "stringst"
}
```

<h3 id="post__users-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[CreateUserDTO](#schemacreateuserdto)|true|none|

<h3 id="post__users-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|201|[Created](https://tools.ietf.org/html/rfc7231#section-6.3.2)|User created successfully|None|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad request|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
BearerAuth
</aside>

# Schemas

<h2 id="tocS_LoginDTO">LoginDTO</h2>
<!-- backwards compatibility -->
<a id="schemalogindto"></a>
<a id="schema_LoginDTO"></a>
<a id="tocSlogindto"></a>
<a id="tocslogindto"></a>

```json
{
  "email": "user@example.com",
  "password": "stringst"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|email|string(email)|true|none|none|
|password|string|true|none|none|

<h2 id="tocS_LockCouponDTO">LockCouponDTO</h2>
<!-- backwards compatibility -->
<a id="schemalockcoupondto"></a>
<a id="schema_LockCouponDTO"></a>
<a id="tocSlockcoupondto"></a>
<a id="tocslockcoupondto"></a>

```json
{
  "userId": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|userId|string|true|none|none|

<h2 id="tocS_AssignCouponDTO">AssignCouponDTO</h2>
<!-- backwards compatibility -->
<a id="schemaassigncoupondto"></a>
<a id="schema_AssignCouponDTO"></a>
<a id="tocSassigncoupondto"></a>
<a id="tocsassigncoupondto"></a>

```json
{
  "userId": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|userId|string|true|none|none|

<h2 id="tocS_AssignRandomCouponDTO">AssignRandomCouponDTO</h2>
<!-- backwards compatibility -->
<a id="schemaassignrandomcoupondto"></a>
<a id="schema_AssignRandomCouponDTO"></a>
<a id="tocSassignrandomcoupondto"></a>
<a id="tocsassignrandomcoupondto"></a>

```json
{
  "userId": "string",
  "couponBookId": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|userId|string|true|none|none|
|couponBookId|string|true|none|none|

<h2 id="tocS_CreateCouponBookDTO">CreateCouponBookDTO</h2>
<!-- backwards compatibility -->
<a id="schemacreatecouponbookdto"></a>
<a id="schema_CreateCouponBookDTO"></a>
<a id="tocScreatecouponbookdto"></a>
<a id="tocscreatecouponbookdto"></a>

```json
{
  "name": "string",
  "description": "string",
  "startDate": "string",
  "endDate": "string",
  "isActive": true,
  "maxRedemptionsPerUser": 0,
  "maxCodesPerUsers": 0,
  "allowMultipleRedemptions": true,
  "codePattern": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|name|string|true|none|none|
|description|string|false|none|none|
|startDate|string|true|none|none|
|endDate|string|true|none|none|
|isActive|boolean|false|none|none|
|maxRedemptionsPerUser|number|false|none|none|
|maxCodesPerUsers|number|false|none|none|
|allowMultipleRedemptions|boolean|false|none|none|
|codePattern|string|false|none|none|

<h2 id="tocS_GenerateCodesDTO">GenerateCodesDTO</h2>
<!-- backwards compatibility -->
<a id="schemageneratecodesdto"></a>
<a id="schema_GenerateCodesDTO"></a>
<a id="tocSgeneratecodesdto"></a>
<a id="tocsgeneratecodesdto"></a>

```json
{
  "quantity": 1,
  "couponBookId": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|quantity|number|true|none|none|
|couponBookId|string|true|none|none|

<h2 id="tocS_UploadCouponsDTO">UploadCouponsDTO</h2>
<!-- backwards compatibility -->
<a id="schemauploadcouponsdto"></a>
<a id="schema_UploadCouponsDTO"></a>
<a id="tocSuploadcouponsdto"></a>
<a id="tocsuploadcouponsdto"></a>

```json
{
  "codes": [
    null
  ],
  "couponBookId": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|codes|[any]|true|none|none|
|couponBookId|string|true|none|none|

<h2 id="tocS_CreateUserDTO">CreateUserDTO</h2>
<!-- backwards compatibility -->
<a id="schemacreateuserdto"></a>
<a id="schema_CreateUserDTO"></a>
<a id="tocScreateuserdto"></a>
<a id="tocscreateuserdto"></a>

```json
{
  "firstName": "string",
  "lastName": "string",
  "email": "user@example.com",
  "password": "stringst"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|firstName|string|true|none|none|
|lastName|string|true|none|none|
|email|string(email)|true|none|none|
|password|string|true|none|none|

