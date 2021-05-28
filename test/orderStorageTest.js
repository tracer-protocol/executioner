let assert = require('assert');
const { OrderStorage } = require('../orderStorage');
require('dotenv').config()
let Web3 = require('web3');
let web3 = new Web3(process.env.ETH_URL)

//EIP712 Signature Example
let exampleSignatureRaw = "0x790638318b21ec73c6ac6cf5596d32bfe63928bd2fe6793e969c300e6039507235ff44e018faec98c43ec61d1919242dd11979a4692cb162571df703135e18fc1b"
const sampleOrder1 = {
    "id": 0,
    "address": "0x529da3408a37a91c8154c64f3628db4eaa7b8da2",
    "market": "0x529da3408a37a91c8154c64f3628db4eaa7b8da2",
    "side": "Bid",
    "price": 12,
    "amount": 5,
    "expiration": 1596600983,
    "flags": { "bits": 1 },
    "signed_data": web3.utils.hexToBytes(exampleSignatureRaw),
}

const sampleOrder2 = {
    "id": 0,
    "address": "0x529da3408a37a91c8154c64f3628db4eaa7b8da2",
    "market": "0x529da3408a37a91c8154c64f3628db4eaa7b8da2",
    "side": "Ask",
    "price": 12,
    "amount": 5,
    "expiration": 1596600983,
    "flags": { "bits": 1 },
    "signed_data": web3.utils.hexToBytes(exampleSignatureRaw),
}

const sampleMarket1 = "0x529da3408a37a91c8154c64f3628db4eaa7b8da2"
const sampleMarket2 = "0x529da3408a37a91c8154c64f3628db4eaa7b8db3"

let orderStorage
beforeEach(() => {
    orderStorage = new OrderStorage()
})

context('Initialises', async () => {
    it('Has no markets', async() => {
        let allOrders = orderStorage.getAllOrders(sampleMarket1)
        assert.strictEqual(allOrders, null)
    })
});

context('Adding orders', async() => {
    it('Adds orders successfully to multiple markets', async () => {
        orderStorage.addOrders(sampleOrder1, sampleOrder2, sampleMarket1)
        orderStorage.addOrders(sampleOrder1, sampleOrder2, sampleMarket2)
        
        //Get markets
        let market1Orders = orderStorage.getAllOrders(sampleMarket1)
        let market2Orders = orderStorage.getAllOrders(sampleMarket2)

        //Validate
        assert.strictEqual(market1Orders[0].length, 1)
        assert.strictEqual(market1Orders[1].length, 1)
        assert.strictEqual(market1Orders[2], 2)
        assert.strictEqual(market1Orders[0][0], sampleOrder1)
        assert.strictEqual(market1Orders[1][0], sampleOrder2)

        assert.strictEqual(market2Orders[0].length, 1)
        assert.strictEqual(market2Orders[1].length, 1)
        assert.strictEqual(market2Orders[2], 2)
        assert.strictEqual(market2Orders[0][0], sampleOrder1)
        assert.strictEqual(market2Orders[1][0], sampleOrder2)
    })
})

context('Clearing orders', async() => {
    it('Can clear an order book', async() => {
        orderStorage.addOrders(sampleOrder1, sampleOrder2, sampleMarket1)
        orderStorage.addOrders(sampleOrder1, sampleOrder2, sampleMarket2)

        orderStorage.clearMarket(sampleMarket1)

        //Market 1 should now be cleared
        let market1Orders = orderStorage.getAllOrders(sampleMarket1)

        assert.strictEqual(market1Orders[0].length, 0)
        assert.strictEqual(market1Orders[1].length, 0)
        assert.strictEqual(market1Orders[2], 0)
    })
})
