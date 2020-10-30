import {loopTest} from "./loop";

let startTime = process.uptime();           // 스레드 생성 시간.
import Worker from "worker_threads";

let jobSize = 1000000000;

loopTest(jobSize);      // 스레드가 처리해야 할 CPU 하드한 작업

let endTime = process.uptime();

console.log(Worker.threadId + " thread time: " + (endTime - startTime));
