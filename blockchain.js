import crypto from "crypto";
import got from "got";
import sha256 from "crypto-js/sha256";


/**
 * 区块维护相关功能
 */

class Blockchain {
  constructor() {
    this.chains = [];
    this.currentTransactions = []; // 记录接受的交易信息
    this.nodes = new Set(); // 记录所有的节点
    this.difficult = "0000"; // 工作量证明的难度，实际为256 位的十六进制数，这里简化为'0000'
    // 创建私钥
    this.privateKey = crypto.createECDH("secp256k1");
  }
  /**
   * 创建区块
   * @param {上一个区块的hash} previousBlockHash
   * @returns
   */
  addBlock(blockHeader) {
    // 这里忽略了区块大小、merkle根节点对所有交易信息的hash等等
    const block = {
      blockHeader,
      transactions: this.currentTransactions,
    };
    this.currentTransactions = []; // 重置交易记录
    this.chains.push(block);
  }
  /**
   * 创建一快交易
   * @param {发送方地址} input String
   * @param {接收方地址} output String
   * @param {交易数量} amount number
   * @returns
   */
  createTransaction({ input, output, amount }) {
    const transaction = {
      input,
      output,
      amount,
    };
    return transaction;
  }

  /**
   * 工作量证明, 通过计算得到一个符合条件的nonce
   *
   */
  proofOfWork(previousBlockHash) {
    let nonce = 0;
    const difficult = this.getDifficult();
    // 从 0 开始循环随机数, 直到找到一个符合条件的nonce后跳出循环
    while (true) {
      let blockHeader = {
        nonce,
        // 使用当前的 Unix 时间戳作为时间戳。如果验证时的时间戳与该时间相差太大，那么该区块将被视为无效。
        timestamp: Date.now(),
        previousBlockHash,
        difficult,
      };
      // 使用 SHA-256 算法计算哈希值,将哈希值转换为十六进制字符串
      const blockHash = this.hashBlock(blockHeader);
      // 如果区块头的哈希值小于难度目标，那么成功返回
      if (blockHash < difficult) {
        // blockHeader.blockHash = blockHash;
        return blockHeader;
      }
      nonce += 1;
    }
  }

  /**
   * 验证工作量证明是否符合难度
   */
  proofIsValid(blockHeader) {
    let blockHash = this.hashBlock(blockHeader);
    return blockHash < blockHeader.difficult;
  }

  // 获取最后一个区块
  getLastBlock() {
    return this.chains[this.chains.length - 1];
  }

  // 对一个区块进行哈希运算
  hashBlock(block) {
    const blockStr = JSON.stringify(block);
    return sha256(blockStr).toString()
  }

  /**
   * 挖矿
   */
  mine(transaction) {
    // 第一笔coinbase记录与矿工打包区块成功的奖励和手续费
    const conbase = {
      input: "",
      output: this.privateKey.generateKeys(),
      amount: 1,
    };
    // 打包交易
    this.currentTransactions.push(this.createTransaction(conbase));
    this.transactions.push(this.createTransaction(transaction));
    // 获取前一个区块的工作量证明
    const previousBlockHash = this.getLastBlock().blockHash;
    // 传入上个区块的信息，开始挖矿(计算随机数)
    const blockHeader = this.proofOfWork(previousBlockHash);
    // 创建区块
    this.addBlock(blockHeader);
    const newestBlock = this.getLastBlock();
    return {
      message: "New Block Forged",
      ...newestBlock,
    };
  }

  /**
   * 判断一条链是否合法有效
   * @param {链} chain
   */
  isChainValid(chain) {
    let previousBlock = chain[0];
    let currentIndex = 1;
    // 循环遍历每一个区块直到最后一个
    while (currentIndex < chain.length) {
      const currentBlock = chain[currentIndex];
      // 判断当前区块的hash是否正确
      if (currentBlock.previousBlockHash !== this.hashBlock(previousBlock)) {
        return false;
      }
      // 判断当前区块的工作量证明是否正确
      if (!this.proofIsValid(currentBlock.blockHeader)) {
        return false;
      }
      previousBlock = currentBlock;
      currentIndex += 1;
    }
    return true;
  }

  /**
   * 解决链冲突，选取节点里面最长的链
   */
  async resolveConflicts() {
    // 遍历所有邻近节点，找到比自己长的并且合法的链，选取最长的
    const neighbours = this.nodes.values();
    const myChianLength = this.chains.length;
    for (const neighbourNode of neighbours) {
      const { data } = await got(`${neighbourNode}/api/fullchains`).json();
      if (
        myChianLength < data.fullchains.length &&
        this.isChainValid(data.fullchains)
      ) {
        this.chains = data.fullchains;
        myChianLength = this.chains.length;
      }
    }
  }

  /**
   * 添加邻近节点
   * @param {节点地址} address
   */

  addNeiborNode(address) {
    this.nodes.add(address);
  }

  /**
   *
   * 在比特币网络中，难度目标每 2016 个区块（约两周）调整一次。调整的公式如下：
   * new_difficulty = old_difficulty * (target_timespan / actual_timespan) ** (1 / 4)
   * new_difficulty 是新的难度目标。
   * old_difficulty 是旧的难度目标。
   * target_timespan 是期望的区块生成间隔，为 10 分钟。
   * actual_timespan 是实际的区块生成间隔，为 2016 个区块的生成时间。
   */
  getDifficult() {
    // 这里简化为固定的难度
    return this.difficult;
  }
}

export default Blockchain;
