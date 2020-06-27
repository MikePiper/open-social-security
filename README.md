# OpenSocialSecurity

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 1.7.4.

**What Does This Calculator Do?**

Firstly, please know that everything is done in "real" (i.e., inflation-adjusted) dollars. So there is no need for the user to make manual inflation adjustments.

Let's consider the simplest example: an unmarried person, using the calculator prior to age 62.

For such a person, the calculator:
1) First assumes they file ASAP at 62.
2) Calculates the amount of their monthly retirement benefit under such assumption.
3) For each year up to age 115, the calculator multiplies the annual retirement benefit by the user's probability of being alive in such year, to arrive at a probability-weighted annual benefit.
4) That probability-weighted benefit is then discounted back to age-62 value using the discount rate the user provided as input (i.e., to account for the fact that a dollar today can be invested and is therefore worth more than even an inflation-adjusted dollar in the future).
5) All of those probability-weighted, discounted benefit amounts are summed, to arrive at a total "present value" for the assumed claiming strategy (e.g., claiming ASAP at 62).
6) The above process is repeated for each possible claiming age (i.e., every month between 62 and 70).
7) The claiming age that had the highest present value is then suggested to the user, and the present value associated with such claiming age is provided as well.

If the person is older than 62 when using the calculator, claiming strategies that are no longer possible (i.e., filing in the past) are eliminated from the analysis.

For a married couple, it's the same sort of process, but with more going on. Specifically:
1) In addition to retirement benefits, spousal benefits and survivor benefits are included in the analysis.
2) Probability weighting the various benefits each period involves separate calculations for "probability only Spouse A is alive", "probability only Spouse B is alive", and "probability both spouses are still alive."
3) Each combination of possible claiming ages must be considered, for both spouses, and for both types of benefits (i.e., retirement and spousal).

When calculating monthly benefit amounts, as long as the user provides the necessary inputs, the calculator will account for an assortment of complicating factors, including:
*Government Pension Offset (GPO) and Windfall Elimination Provision (WEP);
*Child benefits for minor children or adult disabled children;
*Disability benefits;
*Child-in-care spousal benefits;
*The fact that people born prior to January 2, 1954 have a different set of deemed filing rules than people born on or after that date;
*Voluntary suspension;
*Family maximum and combined family maximum rules;
*The earnings test, for people who are younger than full retirement age and still working;
*Retroactive applications.
