//let serialiseOrder = require("./orderSerialisation").serialiseOrder
let omeOrderToOrder = require("@tracer-protocol/tracer-utils").omeOrderToOrder
const web3 = require("web3")

/**
 * Submit orders to the on chain trader contract.
 */
const submitOrders = async (makerOrders, takerOrders, contract, market, sendingAccount) => {
    let serialisedMakeOrders = makerOrders.map((order) => omeOrderToOrder(web3, order))
    let serialisedTakeOrders = takerOrders.map((order) => omeOrderToOrder(web3, order))
    try {
        let gas = await contract.methods.executeTrade(serialisedMakeOrders, serialisedTakeOrders, web3.utils.toChecksumAddress(market)).estimateGas({ from: sendingAccount })
        let txn = await contract.methods.executeTrade(serialisedMakeOrders, serialisedTakeOrders, web3.utils.toChecksumAddress(market)).send({ from: sendingAccount, gas: gas })
        return txn
    } catch (e) {
        console.error(e)
    }
}

module.exports = {
    submitOrders
}