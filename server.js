import worker, {Worker} from "worker_threads";
import {loopTest} from "./loop";

const worker1 = new Worker(__dirname + "/worker.js");
const worker2 = new Worker(__dirname + "/worker.js");
const worker3 = new Worker(__dirname + "/workerParentPort.js");

if (worker.isMainThread) {
    console.log(`${worker.threadId} is Main-thread`);
}

let startTime = process.uptime();
const jobSize = 1000000000
loopTest(jobSize);
let endTime = process.uptime();
console.log("main thread time: " + (endTime - startTime));

setTimeout(() => {
    worker3.postMessage('message from mainThread');
}, 2000);

worker3.on('message', (msg) => {
    console.log(msg);
});
