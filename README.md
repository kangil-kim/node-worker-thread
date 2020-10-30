# Node.js multi-thread 간단한 테스트

Node.js 는 싱글 스레드 이벤트 루프를 사용한다고 알려져있다.

이러한 이유 때문에 Node.js 는 싱글 스레드 라고 알고 있는 사람이 많지만, 
내부적으로 스레드풀을 두어 I/O 작업에 스레드를 사용할 수 있도록 한다고 한다.

> Thread Pool: 작업 처리에 사용되는 스레드를 제한된 개수만큼 정해놓고 
> 작업 큐(Queue)에 들어오는 작업들을 하나씩 스레드가 맡아 처리하는 것
>
> I/O: 입출력 동작 처리 방식 
>
> 기본적으로 입출력 동기화에는 동기 I/O 와 비동기 I/O 두가지가 존재함.
>
> 동기 처리에서는 스레드가 행동에 들어가면 요청이 완료될 때 까지 기다려야 하지만, 비동기 환경
> 에서 같은 행동이 일어나면 스레드는 커널의 도움을 받아 I/O 작업을 처리한다. 실제로 스레드는 요청을
> 커널에 즉시 전달하고 계속해서 다른 작업을 처리한다. 커널은 작업이 완료됐을 때 스레드에 신호를 보내고,
> 스레드는 현재 작업을 중단하고 I/O 작업의 데이터를 필요한대로 처리하는 것으로 이 신호에 답한다.

```shell script
npm run start
ps 
ps -M {PID}
```

실제 위와 같이 command 를 입력해서 확인해보면 내부적으로 multi thread 를 사용한다는 것을 알 수 있다.

```
USER         PID   TT   %CPU STAT PRI     STIME     UTIME COMMAND
kangil.kim 71508 s001    0.0 S    31T   0:00.04   0:00.15 nodemon -r esm server.js
           71508         0.0 S    31T   0:00.00   0:00.00
           71508         0.0 S    31T   0:00.00   0:00.01
           71508         0.0 S    31T   0:00.00   0:00.01
           71508         0.0 S    31T   0:00.00   0:00.01
           71508         0.0 S    31T   0:00.00   0:00.01
           71508         0.0 S    31T   0:00.00   0:00.00
           71508         0.0 S    31T   0:00.00   0:00.00
           71508         0.0 S    31T   0:00.00   0:00.00
           71508         0.0 S    31T   0:00.00   0:00.00
           71508         0.0 S    31T   0:00.00   0:00.00
           71508         0.0 S    31T   0:00.00   0:00.00
           71508         0.0 S    31T   0:00.00   0:00.00
```

node.js가 사용하는 libuv의 모듈은 내부적으로 thread pool을 두어 I/O 작업을 
thead pool에 존재하는 thread를 사용해 처리하기 때문에 event loop는 Block 당하지 않고 
빠르게 작업을 계속 진행할 수 있다고 한다.

하지만 개발을 할때는 싱글 스레드인 이벤트 루프에서만 작업했었다. 따라서 CPU 작업량이 많은
코드는 다른 자바스크립트 코드를 동작하지 않게 만들어 다른 작업이 중단된 것처럼 보일 수 있는
문제점이 있었다.

이를 해결하기 위해 Node.js 는 10.5.0 버전 부터 `worker_thread` 라는 모듈을 통해 thread pool 에 스레드를
생성할 수 있다고 한다. 한가지 주의해야 할 점이 있다면 node 를 실행시킬때 아래의 플래그를 넣어 실행해야 한다.

>  --experimental-worker

## Loop Test

많은 수의 반복문을 돌며 여러개의 반복문이 동시적으로 실행될때 
싱글스레드와 멀티스레드 간의 시간차이를 알아본다.

### thread 생성 (worker 생성)

worker 를 생성하는 방법은 간단하다.

하나의 파일(해당 폴더에서는 worker.js)을 만들어 원하는 작업을 실행하게 해준뒤
worker 인스턴스를 생성해주면 된다.

```javascript loop.js
export const loopTest = times => {
    let data;
    for (let i = 0; i < times; i++) {      // CPU Hard
        data += i;
    }
}

```

```javascript worker.js
import {loopTest} from "./loop";

let startTime = process.uptime();           // 스레드 생성 시간.
import Worker from "worker_threads";

let jobSize = 100000;

loopTest(jobSize);      // 스레드가 처리해야 할 CPU 하드한 작업

let endTime = process.uptime();

console.log(Worker.threadId + " thread time: " + (endTime - startTime));
```

```javascript server.js
import {Worker} from "worker_threads";
const worker1 = new Worker(__dirname + "/worker.js");
```

worker 인스턴스 생성할때 파일 경로를 넘겨주면 된다. 이때 worker.js 에서
Worker.threadId 를 사용하고 있는 것을 확인할 수 있는데, 이는 node Worker-thread 에서
제공해주는 객체이므로 threadId 말고 많은 값을 전달해준다.

[Worker threads Object](https://nodejs.org/api/worker_threads.html)

--------------------------------------------------------------------------------

```javascript
const worker1 = new Worker(__dirname + "/worker.js");
const worker2 = new Worker(__dirname + "/worker.js");

let startTime = process.uptime();
const jobSize = 100000
loopTest(jobSize);
let endTime = process.uptime();
console.log("main thread time: " + (endTime - startTime));
```

main thread 와 thread 2개를 생성해서 해당 작업에 걸린 시간

```
main thread time: 0.002386587999999995
1 thread time: 0.0014319909999999936
2 thread time: 0.0014181399999999844
```

이후 worker 부분을 주석하고 main thread 에서만 동작하게 해봤을 때의 시간

```
main thread time: 0.0023837830000000004
```

thread 를 생성했을 때 오히려 시간이 더 오래 걸리는 것을 확인할 수 있다.
thread 를 생성하는 작업의 걸리는 시간이 오히려 느리게 한다.

이번에는 작업량(jobSize = 1000000000)을 늘려서 테스트를 해본다.

```javascript multi-thread
main thread time: 1.101134851
1 thread time: 1.090782331
2 thread time: 1.090500553
```

```javascript single-thread
main thread time: 3.356532853
```

작업량이 많아졌을 경우 main-thread 의 작업 속도가 3배 가까이 줄어든 것을 확인할 수 있다.
처리 시간 최적화가 필요할때 사용하면 좋을것으로 판단된다.

## Message 전송

thread간 통신은 Message를 통해서 이루어 진다. Message 전송시에는 postMessage() 메소드를 이용하고,
Message 수신시에는 'message' 이벤트 핸들러로 데이터 처리가 가능하다.

```javascript server.js
setTimeout(() => {
    worker3.postMessage('message from mainThread');
}, 2000);

worker3.on('message', (msg) => {
    console.log(msg);
});
```

```javascript workerParentPort.js
import {isMainThread, parentPort, threadId} from 'worker_threads';

console.log('parentPort isMainThread:', isMainThread); // false

parentPort.on('message', (msg) => {
    console.log(msg);
    setTimeout(() => {
        parentPort.postMessage(`message from worker ${threadId}`);
    }, 2000);
});

```

이외에도 worker 관련 몇몇 method 를 제공해주고 있다. 

---------------------------------------------------------------------------

참조

- [Node.js v10.5.0 Change logs](https://github.com/nodejs/node/blob/master/doc/changelogs/CHANGELOG_V10.md#2018-06-20-version-1050-current-targos)

- [Node.js에서 thread 생성하기](https://psyhm.tistory.com/45)

- [동기 I/O와 비동기 I/O](https://12bme.tistory.com/232)
