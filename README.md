# OpenSocialSecurity

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 1.7.4.

**What Does This Calculator Do?**

Firstly, please know that everything is done in "real" (i.e., inflation-adjusted) dollars. So there is no need for the user to make manual inflation adjustments.

Let's consider the simplest example: an unmarried person, using the calculator prior to age 62.

For such a person, the calculator:
1) First assumes they file ASAP at 62.
2) Calculates the amount of their monthly retirement benefit under such assumption.
3) For each month up to age 115, the calculator multiplies that monthly retirement benefit by the user's probability of being alive in such month, to arrive at a probability-weighted monthly benefit.
4) That probability-weighted benefit is then discounted back to age-62 value using the discount rate the user provided as input (i.e., to account for the fact that a dollar today can be invested and is therefore worth more than even an inflation-adjusted dollar in the future).
5) All of those monthly probability-weighted, discounted benefit amounts are summed, to arrive at a total "present value" for the assumed claiming strategy (e.g., claiming ASAP at 62).
6) The above process is repeated for each possible claiming age (i.e., every month between 62 and 70).
7) The claiming age that had the highest present value is then suggested to the user, and the present value associated with such claiming age is provided as well.

If the person is older than 62 when using the calculator, claiming strategies that are no longer possible (i.e., filing in the past) are eliminated from the analysis.

For a married couple, it's the same sort of process, but with more going on. Specifically:
1) In addition to retirement benefits, spousal benefits and survivor benefits are included in the analysis.
2) Probability weighting the various benefits each month involves separate calculations for "probability only Spouse A is alive", "probability only Spouse B is alive", and "probability both spouses are still alive."
3) Each combination of possible claiming ages must be considered, for both spouses, and for both types of benefits (i.e., retirement and spousal).


**How Does the Actual Code Work?**

[step-by-step walk through of the app itself]