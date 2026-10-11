---
title: "RZ-XX7-C : Beyond the Engine"
date: 2026-06-16
author: "Aditeya Sarkar"
category: "Electrical & Testing"
excerpt: "Ashwa Racing is building the RZ-XX7-C with a simplified, system-level electrical design: fewer boards, a single Interface Control Unit, a digital APPS, an upgraded BSPD, and a cheaper, more capable Relay Board.   Meanwhile, the IT team launched the club's open-source website and is starting work on an ERP system and driverless vehicle research."
featured: false
cover: "https://assets.ashwaracing.org/images/blog/2026-06-16-rz-xx7-c-beyond-the-engine-image-1.png"
cover_alt: "Article image 1"
---

![Article image 1](https://assets.ashwaracing.org/images/blog/2026-06-16-rz-xx7-c-beyond-the-engine-image-1.png)

As we move to the end of the RZ-XX6-C post-race testing phase to the manufacturing of the RZ-XX7-C, significant improvements have been incorporated with regard to the design and overall planned execution. The team has learnt a lot and done a lot to rectify the glaring problems with the last prototype.

Coming to the electrical systems, last year's designs presented significant challenges in terms of system integration, packaging, manufacturability, testing, and cost. To address these shortcomings, the team adopted a completely new design philosophy. Rather than developing each subsystem in isolation, the focus shifted toward a system-level approach, with integration, reliability, and ease of manufacturing taking precedence throughout the design process.

The redesign begins at the heart of our prototype, the MoTeC M800 ECU. In the previous season, our telemetry architecture relied on more than five separate PCBs. The overall design was far from optimal, resulting in lengthy procurement and manufacturing timelines, higher costs, and a final integration that proved difficult to package and maintain.

To address these issues, a clear set of pre-design objectives was established before any hardware development began. This year's architecture was designed to:

- Meet the functional requirements of every subsystem.

- Maximise the utilisation of the features already available within the MoTeC ecosystem.

Beyond its conventional functions, the MoTeC M800 is now also responsible for acquiring wheel speed and damper travel data.

All data is transmitted over CAN 2.0 to our Interface Control Unit (ICU), which is our integrated Wireless Telemetry, IMU, Display, and RPM processing unit.

![Article image 2](https://assets.ashwaracing.org/images/blog/2026-06-16-rz-xx7-c-beyond-the-engine-image-2.png)

The Harness Schematic

The Interface Control Unit (ICU) was developed with packaging and integration as the primary design goals. Last year's implementation required three separate boards at the front of the vehicle, adding unnecessary complexity without providing meaningful benefits. The new ICU consolidates these functions into a single compact unit mounted directly behind the display. The ICU is powered directly from the low-voltage (LV+) supply (11–16 V), while the display is powered via the ICU's integrated 5 V buck converter through a USB-C connector.

![Article image 3](https://assets.ashwaracing.org/images/blog/2026-06-16-rz-xx7-c-beyond-the-engine-image-3.png)

3D Render of ICU (i) Bare (ii) Behind the display

In addition to these changes, the vehicle now utilizes a digital APPS. Compared to the previous analog APPS, the digital one offers improved reliability and a more cost-effective solution.

![Article image 4](https://assets.ashwaracing.org/images/blog/2026-06-16-rz-xx7-c-beyond-the-engine-image-4.png)

3D Render of (i) APPS Board (ii) BSPD

Similarly, BSPD has been designed with integrated brake light control functionality. By incorporating brake light actuation directly into the BSPD, the need for a dedicated brake light actuation board has been eliminated, simplifying the electrical architecture.

We also replaced the power distribution board, which was abominably expensive and only partially functional, with the Relay Board at roughly one-eighth of the cost and twice the functionality. The Relay Board allows us to control all the cooling systems through the MoTeC ECU as well as manually by the driver.

![Article image 5](https://assets.ashwaracing.org/images/blog/2026-06-16-rz-xx7-c-beyond-the-engine-image-5.png)

Open-top render of  draft MoTeC and Conduit Box

The IT team has been working around the clock to get our website up and running at [www.ashwaracing.org](http://www.ashwaracing.org) The website code is fully open source and available at our organization's [GitHub](https://github.com/Ashwa-Racing). The website is fully up and logs our current newsletters, along with a gallery with exclusive images, our prototypes from the beginning of the club, and other details. Do visit the website!

![Article image 6](https://assets.ashwaracing.org/images/blog/2026-06-16-rz-xx7-c-beyond-the-engine-image-6.png)

Snippet of our website!

Apart from website development, the IT team has been working on a custom ERP software stack while simultaneously advancing the development of our DV systems. Currently, the team is in the pre-design phase, studying research papers, evaluating existing implementations, and analysing their results to establish a strong technical foundation.

![Article image 7](https://assets.ashwaracing.org/images/blog/2026-06-16-rz-xx7-c-beyond-the-engine-image-7.png)

Snippet of a paper we are referring

With a rapidly evolving technological landscape, there is always something new to explore. Ashwa Racing provides the perfect platform to experiment with emerging technologies, enabling members to transform theoretical knowledge into practical engineering solutions.
