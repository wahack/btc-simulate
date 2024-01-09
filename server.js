/**
 * 节点客户端
 */
import Koa from 'koa';
import Router from 'koa-router';
import bodyParser from 'koa-bodyparser';
import Blockchain from './v0.1/blockchain.js';
import { emitter } from './network.js';

const app = new Koa();
const router = new Router();
let nodeName = process.argv[2];
let randomPort = Math.floor(Math.random() * 1000) + 3000;

if (!nodeName) {
  console.log('Please specify a node name');
  process.exit(1);
}
const blockchain = new Blockchain(nodeName);




/**
 * 获取 请求客户端的ip地址
 */
function getClientIp(req) {
  return req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress;
};

router.post('/api/subscribe', async (ctx) => {
  const {data, type} = ctx.request.body;
  emitter.emit(type, data);
  ctx.body = 'recieve success';
});


// 注册节点，向临近节点发送注册请求
router.post('/api/register', async (ctx) => {
  // 获取 ip
  const ip = getClientIp(ctx.req);
  const nodes = blockchain.addNode(ip);
  ctx.body = {
    message: 'New node has been added',
    data: {
      totalNodes: nodes
    }
  };
});

// 获取完整的区块
router.get('/api/fullchains', async (ctx) => {
  ctx.body = {
    message: 'Get full chains successfully',
    data: {
      fullchains: blockchain.chains
    }
  };
});

// 发送本节点所保存的临近节点
router.get('/api/nodes', async (ctx) => {
  ctx.body = {
    message: 'Get nodes successfully',
    data: {
      nodes: blockchain.nodes
    }
  };
});


// Register routes
app.use(router.routes()).use(router.allowedMethods());

app.use(bodyParser());

// Start the server
app.listen(randomPort, () => {
  console.log(`节点${nodeName}启动,地址: http://localhost:${randomPort}`);
});
