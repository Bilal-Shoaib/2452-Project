---
title: Markov-Model-Trainer
author: Bilal Shaikh (shaikhb2@myumanitoba.ca)
date: Winter 2026
---

# Overview

Markov-Model-Trainer is an offline implementation to train the markov model for the point of sale system for COMP 2452 in Winter 2026.

# Running

This project is a Node.js project. You can run it on the command line using `node`:

```bash
node dist/main.js
```

If you encounter an error related to node when running `node dist/main.js`, try running these lines sequentially:

```bash
npm install -D typescript @types/node
npx tsc
node dist/main.js
```

And then go to the main project directory to find the trained matrix in [matrix.csv](../matrix.csv).