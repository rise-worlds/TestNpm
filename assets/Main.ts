import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

import Web3 from '../node_modules/web3/dist/web3.min.js'

@ccclass('Main')
export class Main extends Component {
    MAKE_TRADE_BIN = {
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
    ERC_UNIT = 1000000000000000000;
    monkeyGameContractAddress = 0xb0D15b952F0836359F1a86e49dEbC5F449295699;

    async getChainId() {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' })
            .catch((err) => {
                console.error("get chainId fail:", err)
            });
        return parseInt(chainId, 16);;
    }
    async getAccount() {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
            .catch((err) => {
                if (err.code === 4001) {
                    console.log('Please connect to MetaMask.');
                } else {
                    console.error("User denied account access", err)
                }
            });
        const account = accounts[0];
        return account;
    }
    async getBalance(address) {
        const balance = await window.ethereum.request({ method: 'eth_getBalance', params: [address, 'latest'] })
            .catch((err) => {
                console.error("get balance fail:", err)
            });
        return parseInt(balance, 16);;
    }

    makeTradeOfMonkeyGame(round, betAmount) {
        return web3.eth.abi.encodeFunctionCall(this.MAKE_TRADE_BIN, [
            web3.eth.abi.encodeParameter('uint256', round),
            web3.eth.abi.encodeParameter('uint256', betAmount)
        ]);
    }

    async startBet(account) {
        console.log('begin bet', account)
        let currentRound = 1;//当前游戏的轮次
        let userSelectTable = 2;//用户选中的格子
        let makeTradeValue = 0.02;//投注金额
        //需要将投注金额转为该Matic币的最小精度
        //备注：global.ERC_UNIT = 1000000000000000000 
        let makeTradeBigStringValue = global.floatMul(makeTradeValue, this.ERC_UNIT);//将投注金额乘以10的18次方
        let makeTradeBigValue = global.intToBigNumber(makeTradeBigStringValue).toString(16);//将投注金额转成16进制， 
        var makeTradeParameter = await this.makeTradeOfMonkeyGame(currentRound, userSelectTable)
        window.ethereum.request({
            method: 'eth_sendTransaction',
            params: [
                {
                    from: account,//小狐狸钱包地址
                    to: this.monkeyGameContractAddress,//斗猿场合约地址，由主站提供（0xb0D15b952F0836359F1a86e49dEbC5F449295699）
                    value: '0x' + makeTradeBigValue,//  //把投注金额 乘以 10的18次方  ，然后转换成 16进制,格式：'0x470de4df820000',（1Matic=10的18次方，）
                    data: makeTradeParameter,
                },],
        }).then((txHash) => {
            console.log(txHash)
        }).catch((error) => {
            console.log('Metamask eth_sendTransaction error：', JSON.stringify(error))
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
        const web3 = new Web3(web3Provider);
        console.log(web3);

    }

    update(deltaTime: number) {

    }
}


