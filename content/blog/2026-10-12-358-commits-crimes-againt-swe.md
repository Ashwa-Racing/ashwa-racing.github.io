---
title: "358 Commits, ∞ crimes againt SWE"
date: 2026-10-12
author: "Admin"
category: "IT"
excerpt: "I read every commit message on our website repo so you don’t have to. Some of them are funny. Some of them are a cry for help. One of them literally says “help me”."
featured: false
cover: "https://assets.ashwaracing.org/images/blog/2026-10-12-358-commits-crimes-againt-swe-image-1.jpg"
cover_alt: "Side Profile Man Staring Closely Intensely Stock Photo 481976482 |  Shutterstock"
---

![Side Profile Man Staring Closely Intensely Stock Photo 481976482 |  Shutterstock](https://assets.ashwaracing.org/images/blog/2026-10-12-358-commits-crimes-againt-swe-image-1.jpg)

**358 COMMITS, 3 PRAYERS, 1 “HELP ME”**

*The unofficial biography of our website, told through the git log*

In which a team that promised “no build step” builds three of them, a driver in a halo gets blamed for everything, and one man is quietly banned from an easter egg.

Reading time: about 8 minutes. Sanity required: none.

**Prologue: a promise was made**

Every project starts with a lie. Ours is in the README, and it’s a good one: **“No framework. No build step. Open index.html and it works.”**

I want you to hold on to that sentence, because I spent an evening reading the repo from the first commit to the latest, and that sentence did not survive. By October the “no build step” website had build_site.py, a Wrangler config, a Cloudflare R2 bucket, a nightly bot, two Google Apps Script projects and 33 CSS files. It is the only website I know with a README that reads like a before-and-after photo.

![readme.png](https://assets.ashwaracing.org/images/blog/2026-10-12-358-commits-crimes-againt-swe-image-2.png)

*Left: February. Right: what February did not see coming.*

The README also says the custom domain “is not currently configured” and that the site lives at the default URL. Which is, technically, what a custom domain is. But we’re not here to nitpick. We’re here to nitpick for eight more pages.

# **Act I: Optimism**

The first commit is, with great dignity, “Initial Commit”. Then comes a stretch of people who believed in themselves. “Some more changes.” “Some image optimizations.” Then “Some more image optimizations.” Then, in a bold act of variety, “some image optimizations” with a lowercase s.

There is also “Currently being built to all the pages”, which is a sentence in the way a car with three wheels is a car. You get where it’s going. You don’t want to be a passenger.

This is the honeymoon phase. Nobody has typed a keyboard smash yet. The CSS is young and the !importants are few. Savour it.

# **Act II: The prayer era**

Somewhere around February, the commit messages stopped describing the work and started negotiating with a higher power.

*“claude css :pray fix”*

*“Verification for website, don’t delete the google file :pray”*

*“Styling fixes are upto god :pray”*

Three prayers, one per commit, and honestly the most honest documentation in the repo. If you want to know which parts of our CSS are load-bearing and which are decorative, the answer is: nobody knows, God knows, and God has not pushed to main.

My favourite of the era is “Fixed a lot of errors written by me using Claude, goated ?!” That is a bug fix, a confession and a code review in a single line, finished off with a question mark and an exclamation mark because the author could not decide how they felt. Same, honestly.

And then there is the file. google65122155159fc983.html sits in the root of the site, a Google verification file that must never be deleted. It has a commit message begging us to leave it alone and no other explanation. It is our Stonehenge. We don’t know who built it, but we know what happens if you move it.

# **Act III: March 14th, a day I would like to forget**

Let me set the scene. It’s a Saturday. Someone wants the team page to pull its roster from a Google Form. This is a reasonable thing to want. What follows is not.

![terminal.png](https://assets.ashwaracing.org/images/blog/2026-10-12-358-commits-crimes-againt-swe-image-3.png)

*Seventeen commits. One day. One cry for help, timestamped.*

Read the log top to bottom and you can watch a person’s hope leave their body in real time. “Google form sync tryout ?” is a man with a plan. “pullfix” is a man with a problem. “sync changes”, “Some more changes”, “Some changes for stupid” (stupid is a recipient now) and then “more changes wtf”, which is the commit equivalent of staring at the ceiling.

And at 15:38, seventy-seven minutes after the first commit, just two words: **“help me”.**

Nobody replied. In the meantime, our nightly bot kept quietly committing “Auto-sync team data” with the date and an emoji, like a very polite coworker who keeps filing timesheets while the building is on fire. The bot, I should say, has the best commit messages in the repo. It has never once written “bruh”.

# **The cardiogram**

If you plot the commits per month, you get something that looks suspiciously like a heart monitor in a medical drama.

![months.png](https://assets.ashwaracing.org/images/blog/2026-10-12-358-commits-crimes-againt-swe-image-4.png)

*January: silence. June: we don’t talk about June.*

There is the exam-season flatline, the March spike, a quiet summer and then the October rocket: 57 commits in 12 days. That last bit is the Cloudflare sprint, which we’ll get to. For now, just note that the team’s productivity follows the same law as every student project in history: nothing, nothing, nothing, panic, everything.

And if you plot how sane the commit messages are over the same period, you get this, which I measured very scientifically:

![sanity.png](https://assets.ashwaracing.org/images/blog/2026-10-12-358-commits-crimes-againt-swe-image-5.png)

*Axes are accurate. Methodology is not.*

# **A short dictionary of our commit messages**

For future contributors, here is a translation guide. I have been doing this for a while and I’m fairly confident in it.

- **What the commit said** — **What it meant**

- “asda” / “asdsa” — I fell asleep on the keyboard, but only just

- “bruh” — The build failed for the third time and I’m a different person now

- “she” — I don’t remember. It was important. It’s gone.

- “Some changes for stupid” — A bug, addressed personally

- “LCP fixes for a faster tomorrow :)” — A motivational poster that happens to be a commit

- “Updated www to nothing” — The most philosophical commit in the repo

- “broken update” — A hazard sign, left on main for travellers

- “I am tired boss” — Cannot argue with this one

There is also a short and noble tradition of the SEO saga. On May 11th alone we had “Added canonical urls”, then “Added the canonical urls” (the is new), then “Updated and added canonical url”. It is the same commit being made three times by someone who is slowly losing faith in the word “canonical”. The case was finally closed in October with a custom 404 page, five months later. Justice is slow but it has a lovely 404 page.

# **The Rube Goldberg blog machine**

Now we get to the part where we got a bit carried away. We wanted a blog. A normal person would write a Markdown file and push it. We built this:

![machine.png](https://assets.ashwaracing.org/images/blog/2026-10-12-358-commits-crimes-againt-swe-image-6.png)

*Six services. Eight steps. One article.*

A Google Form feeds an Apps Script that interrogates a DOCX through the Docs API, flattens it into Markdown, ships the images to R2, commits it to GitHub, wakes up a Cloudflare build, and runs a Python script that finally spits out a JSON file. All of this to publish exactly one article at the time of writing: “RZ-XX7-C: Beyond the Engine”.

I checked the documentation, too. Both Apps Script projects have their own SETUP.md. The blog pipeline has more documentation than a few of the subsystems on the actual car. Toyota would call this overengineered. NASA would call it a promising start.

Credit where it’s due, though. Near the end of this pipeline the robot started writing its own commit messages and managed “Add Add article image” six times in a row. Six images, six “Add Add”s. Even the automation stutters when it’s nervous.

# **The CSS: a field guide**

The site has 33 CSS files for roughly 20 pages. The 404 page has its own stylesheet. It has its own design system, for a page nobody wants to see. To be fair, it’s the best copywriting on the whole website: “Off the track. This page isn’t here.” We saved our best writing for our worst day.

Then there is subsystem-refresh.css, which is the name you give a file when you already have subsystem.css and subsystem-landing.css and no energy left to fix either. It’s a sequel with no plot. There are 24 !important declarations across the stylesheets, each one a tiny act of distrust in the cascade, and in us.

And then the z-index. I’d like to present this as evidence.

![zindex.png](https://assets.ashwaracing.org/images/blog/2026-10-12-358-commits-crimes-againt-swe-image-7.png)

*This is not a design system. This is an auction.*

1200, 2500, 9999, 9999 again (someone didn’t trust the first one), and finally 99999. If your modal needs to be that high up, it isn’t a layer anymore, it’s a satellite.

Meanwhile, loader.js runs to 664 lines. For a loading screen. It preloads every sponsor logo, tracks every image and stylesheet, waits for fonts and tries to buffer the audio and video before it lets you see the site. We spent March chasing a perfect LCP score and even deleted the hero video to get there, and then wrote a 664-line bouncer that makes you wait for every single asset anyway. We sprinted to the start line and then locked the gate.

# **The Vibin situation**

I saved the best for here. Deep in scripts/sync.py, the script that syncs our 372-person roster, there is a config block called MANUAL_FLAGS. It has exactly one entry.

![vibin.png](https://assets.ashwaracing.org/images/blog/2026-10-12-358-commits-crimes-againt-swe-image-8.png)

*372 people. One exemption. No explanation.*

Out of 372 team members, one is hard-coded by name, and the only thing the code says about him is that he does not get the easter egg. We have a full 3D easter egg on the team page and one man was personally, explicitly, in Python, ruled out of it.

Was it a request? A penalty? A protest? Did he earn it? I have asked around and nobody remembers, which only makes it better. Vibin, if you’re reading this: the flag stays. It’s part of the heritage now. We love you.

# **Smaller sagas worth a mention**

**The font saga.** February: Google Fonts added. March 31: “better loading times due to no fonts”. April 9: “switched to a swap method”. September 30: “Added fonts”. October 2: “To alleviate CORS for fonts”. That is a seven-month relationship with typography: loved, dumped, taken back, and finally a restraining order from the browser.

**The great prototype photo upload.** On August 6th we uploaded eight cars’ worth of photos in eight consecutive commits, one per car. Then someone cleaned up most of them. It’s the Git version of ordering everything on the menu and asking for a to-go box.

**The merge handshakes.** More than twenty commits read “Merge branch ‘main’ of…” followed by a personal fork. The org repo and a fork spent the year bumping into each other in a hallway, each time saying “oh, you’re here too?”

**The R2 trilogy.** May: “migrate assets to Cloudflare R2”. August: “Update Cloudflare R2 links”. October: “Publish blog articles and images to R2”. R2 is the promised land and the images keep sneaking back across the border.

**The weirdly kind ones.** “fix: July edition taken down” sounds like a newspaper issuing a correction. “code: fixed up heights of short kings :crown” is the most inclusive CSS fix I have ever seen. “Removed launch teaser; added good looking brolls :love” has a feature, a typo and a confession in one line.

# **The October speedrun**

And then, around the 10th, something happened. In roughly 72 hours the repo went from “Prepare Cloudflare Pages build” to deleting the CNAME, retiring the old GitHub Pages workflow, and shipping a crowdfunding page, a minimisable blog popup, an interactive newsletter reader, shareable team profiles and generated SEO pages.

Suddenly the commits were in Conventional Commits. feat(crowdfunding): add rewards and contribution tracking flow. fix(ui): improve update popup section layout. Same repo, same team, but now it owns a blazer. Three days earlier one of those people had typed “help me”.

I don’t know whether a deadline appeared or someone slept, and I have decided not to ask. Some mysteries are better left in the log.

# **Credit where it’s due**

I’ve been joking for pages, so let me be sincere for a paragraph. This codebase is better than its commit messages. The theme toggle wraps localStorage in a try/catch so it works in browsers that block storage, which a lot of production sites don’t bother with. The build script’s front-matter parser reports errors with file names and line numbers. The sync script promises it will never wipe manual entries, and then actually keeps that promise. There is not a single TODO in the repo.

Going from “asdsa” to a custom build pipeline on Cloudflare Workers in under a year, while also building a car, is a real achievement. Most people can’t get a working deploy in that time. We did it with prayers, stubbornness and one very busy bot.

# **Epilogue**

So, 358 commits. Three prayers. One “help me”. Thirty-three CSS files, one z-index of 99999, and exactly one man who isn’t allowed an easter egg. All of it exists to tell the world about a car.

If you’re a new member reading this before touching the repo: welcome. Commit often, write your messages like someone will read them, and for the love of God, don’t delete the Google file.

And please, whatever happens, leave “help me” in the history. It’s the best commit message we have.

**git commit -m "finally done"**
