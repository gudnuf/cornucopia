# cornucopia-locker-keyv

A cornucopia proof locker using [keyv](https://www.npmjs.com/package/keyv)

## Redis

```js
import { CornucopiaKeyVLocker } from "cornucopia-locker-keyv";
import KeyvRedis from "@keyv/redis";

const locker = new CornucopiaKeyVLocker(new KeyvRedis("redis://user:pass@localhost:6379"));
```
