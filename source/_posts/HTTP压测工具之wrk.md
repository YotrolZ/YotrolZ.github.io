---
title: HTTP压测工具之wrk
description: >-
  `wrk` 是一个现代的 HTTP 基准测试工具，能够在单个多核 CPU 上运行时产生大量负载。它结合了多线程设计和可扩展的事件通知系统，例如 epoll
  和 kqueue。
abbrlink: 7da1630e
date: 2022-02-22 18:55:34
tags:
---

# 简述
`wrk` 是一个现代的 HTTP 基准测试工具，能够在单个多核 CPU 上运行时产生大量负载。它结合了多线程设计和可扩展的事件通知系统，例如 epoll 和 kqueue。

# 安装

- 使用`homebrew`安装：
```sh
brew install wrk
```


# 使用
```
wrk -t8 -c200 -d30s "你要压测的接口"
```

- 这将运行 30 秒的基准测试，使用 8 个线程，并保持 200 个 HTTP 连接。

# 运行结果

```
Running 30s test @ 你要压测的接口
  8 threads and 200 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency   234.18ms  350.41ms   1.99s    87.27%
    Req/Sec    43.34     30.72   191.00     67.57%
  9629 requests in 30.06s, 8.31MB read
  Socket errors: connect 0, read 0, write 0, timeout 277
Requests/sec:    320.31
Transfer/sec:    283.01KB
```

- `8 threads and 200 connections` :
开启8个线程, 创建200个连接;

- `Latency`: 代表单个线程的延迟时间;

- `Req/Sec`: 代表单个线程每秒完成的请求数;

- `9629 requests in 30.06s, 8.31MB read`: 在30.06秒之内总共有9629个请求,总共读取的数据大小是8.31MB;

- `Socket errors: connect 0, read 0, write 0, timeout 277`: 总共有277个超时.

- `Requests/sec`: 所有线程平均每秒钟完成了320.31个请求;
- `Transfer/sec`: 每秒钟读取的数据量是283.01KB;