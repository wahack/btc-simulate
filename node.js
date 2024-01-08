/**
 * 节点客户端
 */
import Koa from 'koa';
import Router from 'koa-router';
import bodyParser from 'koa-bodyparser';
import { v4 as uuidv4 } from 'uuid';
import Blockchain from './blockchain';

const app = new Koa();
const router = new Router();

const blockchain = new Blockchain();

/**
 * 获取 请求客户端的ip地址
 */
function getClientIp(req) {
  return req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress;
};

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

router.put('/api/users/:id', async (ctx) => {
  // Logic to update a user
  const updatedUser = await updateUser(ctx.params.id, ctx.request.body);
  ctx.body = updatedUser;
});

router.delete('/api/users/:id', async (ctx) => {
  // Logic to delete a user
  await deleteUser(ctx.params.id);
  ctx.body = 'User deleted successfully';
});

// Register routes
app.use(router.routes()).use(router.allowedMethods());

app.use(bodyParser());

// Start the server
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
