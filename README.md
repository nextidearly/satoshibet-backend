# Satoshibet.fun Backend

## Project setup
```
npm install
```

## Run
```
node server.js
```

## API endpoints
|URL|Description|
|----|-------|
|GET  /ordinals/1.png|Retrieve ordinal image|
|GET  /api/ordinals/whitelisted|Check if an address is whitelisted|
|GET  /api/ordinals/mint/order/:id|Retrieve Order by Order ID|  
|GET  /api/ordinals/mint/order/list/:address|Retrieve Order List by Receive Address|
|POST /api/ordinals/mint/order/create|Create Order to Mint|
|POST /api/ordinals/mint/order/check|Check order to get and save inscription ID|
|POST /api/holders|Retrieve Holders ID & InscriptionIds|

