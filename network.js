/**
 * 网络相关, 监听网络上的节点，进行广播等
 */
import { EventEmitter } from "node:events"

export const emitter = new EventEmitter();

export function subscribe(type, callback) {
  emitter.on(type, callback);
}

export function broadcast(nodes, type, data) {
  for (const node of nodes) {
    got.post(`${node}/api`, {
      json: {
        type,
        data
      }
    });
  }
}
