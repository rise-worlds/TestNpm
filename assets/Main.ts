import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

import Web3 from '../node_modules/web3/dist/web3.min.js'
// import BigNumber from 'bignumber.js'
import BigNumber from '../node_modules/bignumber.js/bignumber.js'

declare global {
    interface Window {
        ethereum;
        web3;
    }
}

const MAKE_TRADE_BIN = {
    "inputs": [{
        "internalType": "uint256",
        "name": "round",
        "type": "uint256"
    }, {
        "internalType": "uint256",
        "name": "prediction",
        "type": "uint256"
    }],
    "name": "makeTrade",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
};
const ERC_UNIT = BigNumber('1000000000000000000', 10);
const monkeyGameContractAddress = '0xb0D15b952F0836359F1a86e49dEbC5F449295699';

@ccclass('Main')
export class Main extends Component {
    private myweb3;
    private myaccount;
    private mybalance;

    async getChainId() {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' })
            .catch((err) => {
                console.error("get chainId fail:", err)
            });
        return parseInt(chainId, 16);;
    }
    async getAccount(): Promise<string> {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
            .catch((err) => {
                if (err.code === 4001) {
                    console.log('Please connect to MetaMask.');
                } else {
                    console.error("User denied account access", err)
                }
            });
        const account: string = accounts[0];
        return account;
    }
    async getBalance(address) {
        const balanceStr = await window.ethereum.request({ method: 'eth_getBalance', params: [address, 'latest'] })
            .catch((err) => {
                console.error("get balance fail:", err)
            });
        let balance = BigNumber(balanceStr, 16);
        balance = balance.dividedBy(ERC_UNIT);
        return balance;
    }

    makeTradeOfMonkeyGame(round, betAmount) {
        return this.myweb3.eth.abi.encodeFunctionCall(MAKE_TRADE_BIN, [
            this.myweb3.eth.abi.encodeParameter('uint256', round),
            this.myweb3.eth.abi.encodeParameter('uint256', betAmount)
        ]);
    }

    async startBet(account, round, table, betAmount) {
        console.log('begin bet', account)
        // let currentRound = 1;//当前游戏的轮次
        // let userSelectTable = 2;//用户选中的格子
        let makeTradeValue = BigNumber(betAmount);//投注金额
        //需要将投注金额转为该Matic币的最小精度
        //备注：global.ERC_UNIT = 1000000000000000000 
        let makeTradeBigStringValue = makeTradeValue.multipliedBy(ERC_UNIT);// global.floatMul(makeTradeValue, ERC_UNIT);//将投注金额乘以10的18次方
        let makeTradeBigValue = makeTradeBigStringValue.toString(16);// global.intToBigNumber(makeTradeBigStringValue).toString(16);//将投注金额转成16进制， 
        var makeTradeParameter = await this.makeTradeOfMonkeyGame(round, table)
        window.ethereum.request({
            method: 'eth_sendTransaction',
            params: [
                {
                    from: account,//小狐狸钱包地址
                    to: monkeyGameContractAddress,//斗猿场合约地址，由主站提供（0xb0D15b952F0836359F1a86e49dEbC5F449295699）
                    value: '0x' + makeTradeBigValue,//  //把投注金额 乘以 10的18次方  ，然后转换成 16进制,格式：'0x470de4df820000',（1Matic=10的18次方，）
                    data: makeTradeParameter,
                },],
        }).then((txHash) => {
            console.log('get bet trx:', txHash)
        }).catch((error) => {
            console.log('Metamask eth_sendTransaction error:', JSON.stringify(error))
        });
    }

    async start() {
        console.log('web3 version:', Web3.version)
        // 检查是否是新的 MetaMask 或 DApp 浏览器
        var web3Provider;
        if (window.ethereum) {
            web3Provider = window.ethereum;
        } else if (window.web3) { // 老版 MetaMask Legacy dapp browsers...
            web3Provider = window.web3.currentProvider;
        } else {
            web3Provider = new Web3.providers.HttpProvider('http://localhost:8545');
        }
        this.myweb3 = new Web3(web3Provider);
        console.log(this.myweb3);

        this.myaccount = await this.getAccount();
        console.log(this.myaccount);

        this.mybalance = await this.getBalance(this.myaccount);
        console.log(this.mybalance.toString(), 'MATIC');

        await this.startBet(this.myaccount, 1, 1, 0.02);
    }

    update(deltaTime: number) {

    }
}


