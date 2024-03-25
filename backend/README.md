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
|GET  /api/ordinals/mint/order/:id|Retrieve Order by Order ID|  
|GET  /api/ordinals/mint/order/list/:address|Retrieve Order List by Receive Address|
|GET  /api/ordinals/mint|Retrieve Next Ordinal Number to Mint|  
|POST /api/ordinals/mint/order/create|Create Order to Mint|
|POST /api/ordinals/mint/order/check|Check order to get and save inscription ID|
|GET  /ordinals/1.png|Retrieve ordinal image|
