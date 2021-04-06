let express = require("express")
let Web3 = require('web3');
let trader = require('./contracts/Trader.json')
let bodyParser = require('body-parser')
let validateOrder = require("./orderValidation").validateOrder
let validatePair = require("./orderValidation").validatePair
let submitOrders = require("./orderSubmission").submitOrders
let OrderStorage = require("./orderStorage").OrderStorage
require('dotenv').config()

// Create a new express app instance
const app = express();
app.use(bodyParser.json())
let web3
let traderContract;

//Orders are kept in memory and executed in batches of 100
let orderStorage = new OrderStorage()

//Routes
app.get('/', (req, res) => {
    res.status(200).send();
});

/**
 * Endpoint used for submitting pairs of orders to the executioner. WIll process the orders
 * once the minimum number of orders (as given by the BATCH_SIZE env variable) is met.
 */
app.post('/submit', async (req, res) => {
    let numOrders = orderStorage.getOrderCounter(req.body.maker.market)
    console.log(`Received Orders. Pending orders to process: ${numOrders}`)

    //Validate orders
    if (!req.body.maker || !req.body.taker ||
        (!validateOrder(req.body.maker) || !validateOrder(req.body.taker) ||
            !validatePair(req.body.maker, req.body.taker))) {
        return res.status(500).send({ error: "Invalid Orders" })
    }

    // //add the order to the order heap for this market
    orderStorage.addOrders(req.body.maker, req.body.taker, req.body.maker.market)
    //repoll the number of orders
    numOrders = orderStorage.getOrderCounter(req.body.maker.market)

    //If enough orders are present, process the orders on chain
    if (numOrders >= process.env.BATCH_SIZE) {
        //submit orders
        console.log(`Submitting ${numOrders} orders to contract`)
        let ordersToSubmit = orderStorage.getAllOrders(req.body.maker.market)
        await submitOrders(ordersToSubmit[0], ordersToSubmit[1], traderContract, req.body.maker.market, web3.eth.defaultAccount)
        //TODO: Decide on error handling for if submitOrders does not process for some reason.
        //clear order storage for this market
        orderStorage.clearMarket(req.body.maker.market)
    }

    //Return
    res.status(200).send()
})

/**
 * Will return the state of the current pending orders for a given market
 */
app.get('/pending-orders/:market', (req, res) => {
    if (!req.params.market) {
        res.status(500)
    } else {
        let orders = orderStorage.getAllOrders(req.params.market)
        if (orders === null) {
            res.status(200).send({
                "makeOrders": [],
                "takeOrders": [],
                "count": 0
            })
        } else {
            res.status(200).send({
                "makeOrders": orders[0],
                "takeOrders": orders[1],
                "count": orders[2]
            })
        }
    }
})

//Start up the server
app.listen(3000, async () => {
    web3 = await new Web3(process.env.ETH_URL)
    console.log(`Connected to RPC ${process.env.ETH_URL}`)
    //Setup signing account
    const account = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);
    web3.eth.accounts.wallet.add(account);
    web3.eth.defaultAccount = account.address;
    let contractABI = trader.abi
    traderContract = new web3.eth.Contract(contractABI, process.env.TRADER_CONTRACT)
    console.log("Execute order 66")
});

module.exports = app;