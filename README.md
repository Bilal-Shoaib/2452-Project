---
title: POS-SYS
author: Bilal Shaikh (shaikhb2@myumanitoba.ca)
date: Winter 2026
---

# Overview

POS-SYS is an implementation of the point of sale system for COMP 2452 in Winter 2026.

# Running

This project is a Node.js project using Vite. You can run it on the command line using `npx`:

```bash
npx vite
```

If you encounter an error related to vite when running `npx vite`, try running these lines sequentially:

```bash
npm install -D vite@latest
npx vite
```

And then open your web browser and go to the address printed out by Vite.

# Domain model, flow diagrams, and UI Assessment

* You can find my domain model in `domain.md`.
* You can find my flow diagrams in `flows.md`.
* You can find my ui assessment in `ui-assessment.md `.

# Markov Model

* See the [training guide](./markov-model/README.md) for details on training the Markov model. 
* The constructed matrix can be found [here](./matrix.csv) after training the markov model.