import {isMainThread, parentPort, threadId} from 'worker_threads';

console.log('parentPort isMainThread:', isMainThread); // false

parentPort.on('message', (msg) => {
    console.log(msg);
    setTimeout(() => {
        parentPort.postMessage(`message from worker ${threadId}`);
    }, 2000);
});
