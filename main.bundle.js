webpackJsonp(["main"],{

/***/ "./src/$$_lazy_route_resource lazy recursive":
/***/ (function(module, exports) {

function webpackEmptyAsyncContext(req) {
	// Here Promise.resolve().then() is used instead of new Promise() to prevent
	// uncatched exception popping up in devtools
	return Promise.resolve().then(function() {
		throw new Error("Cannot find module '" + req + "'.");
	});
}
webpackEmptyAsyncContext.keys = function() { return []; };
webpackEmptyAsyncContext.resolve = webpackEmptyAsyncContext;
module.exports = webpackEmptyAsyncContext;
webpackEmptyAsyncContext.id = "./src/$$_lazy_route_resource lazy recursive";

/***/ }),

/***/ "./src/app/about/about.component.css":
/***/ (function(module, exports) {

module.exports = ""

/***/ }),

/***/ "./src/app/about/about.component.html":
/***/ (function(module, exports) {

module.exports = "<div class=\"container\">\n    <p>Open Social Security is a free, basic, open-source Social Security strategy calculator.</p>\n    <p>Please note that Open Social Security does not currently account for all the various circumstances that a real-life person/couple might face. For instance, it does not currently account for:</p>\n        <ul>\n            <li>The earnings test (for people who are still working and filing for benefits before full retirement age),</li>\n            <li>Child benefits (or spousal benefits for people younger than age 62 with a child in care),</li>\n            <li>Disability benefits,</li>\n            <li>Strategies for people who are already widowed (or widowered) when they are using the calculator,</li>\n            <li>The possibility that your life expectancy (or your spouse's life expectancy) may be significantly shorter or longer than average, or</li>\n            <li>Tax planning reasons or other unrelated reasons why it might be better for you to file earlier or later than the calculator suggests.</li>\n        </ul>\n    <p>I intend to add functionality to account for some of the above things, but it will take time. In the meantime, to learn more about Social Security, including the above topics, you may want to read my book: <em><a href=\"https://www.amazon.com/dp/0997946512/?tag=openss-20/\" target=\"_blank\">Social Security Made Simple</a></em>.</p>\n    <p>Alternatively, you may find one or both of the following (paid) calculators to be helpful. I have no association with either one, but they are each created by respected experts in the field.</p>\n    <ul>\n        <li><a href=\"https://maximizemysocialsecurity.com/\" target=\"_blank\">Maximize My Social Security</a></li>\n        <li><a href=\"http://socialsecuritysolutions.com/\" target=\"blank\">Social Security Solutions</a></li>\n    </ul>\n    <h2>About the Author (Mike Piper)</h2>\n    I am a CPA in St. Louis, Missouri. I'm the author of nine financial books, as well as the popular blog \"<a href=\"https://obliviousinvestor.com/\" target=\"_blank\">Oblivious Investor</a>.\"\n    I am an occasional public speaker (usually about Social Security or tax planning), and I have been quoted as a Social Security expert in numerous publications (e.g., Wall Street Journal, AARP, Kiplinger, and several others).\n    <h2>Math Details</h2>\n    For people interested in the details of how this calculator works, I'd encourage you to read the \"README\" file, available here:\n    <p><a href=\"https://github.com/MikePiper/open-social-security/blob/master/README.md\" target=\"_blank\">https://github.com/MikePiper/open-social-security/blob/master/README.md</a></p>\n    <h2>License</h2>\n    <p>Other parties are encouraged to use the code from this calculator for their own purposes, per the license below. You can download the source code here:</p>\n    <p><a href=\"https://github.com/MikePiper/open-social-security\" target=\"_blank\">https://github.com/MikePiper/open-social-security/</a></p>\n    <p>\"MIT License\"</p>\n    <p>Copyright (c) 2018 Michael Piper (<a href=\"https://obliviousinvestor.com/\" target=\"_blank\">obliviousinvestor.com</a>)</p>\n    <p>Permission is hereby granted, free of charge, to any person obtaining a copy\n    of this software and associated documentation files (the \"Software\"), to deal\n    in the Software without restriction, including without limitation the rights\n    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell\n    copies of the Software, and to permit persons to whom the Software is\n    furnished to do so, subject to the following conditions:</p>\n\n    <p>The above copyright notice and this permission notice shall be included in all\n        copies or substantial portions of the Software.</p>\n\n    <p>THE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\n        IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\n        FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\n        AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\n        LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\n        OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE\n        SOFTWARE.</p>\n</div>"

/***/ }),

/***/ "./src/app/about/about.component.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return AboutComponent; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("./node_modules/@angular/core/esm5/core.js");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};

var AboutComponent = /** @class */ (function () {
    function AboutComponent() {
    }
    AboutComponent.prototype.ngOnInit = function () {
    };
    AboutComponent = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["n" /* Component */])({
            selector: 'app-about',
            template: __webpack_require__("./src/app/about/about.component.html"),
            styles: [__webpack_require__("./src/app/about/about.component.css")]
        }),
        __metadata("design:paramtypes", [])
    ], AboutComponent);
    return AboutComponent;
}());



/***/ }),

/***/ "./src/app/app-routing.module.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return AppRoutingModule; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("./node_modules/@angular/core/esm5/core.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__angular_router__ = __webpack_require__("./node_modules/@angular/router/esm5/router.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__input_form_input_form_component__ = __webpack_require__("./src/app/input-form/input-form.component.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__about_about_component__ = __webpack_require__("./src/app/about/about.component.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__contact_contact_component__ = __webpack_require__("./src/app/contact/contact.component.ts");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};





var routes = [
    { path: '', component: __WEBPACK_IMPORTED_MODULE_2__input_form_input_form_component__["a" /* InputFormComponent */] },
    { path: 'about', component: __WEBPACK_IMPORTED_MODULE_3__about_about_component__["a" /* AboutComponent */] },
    { path: 'contact', component: __WEBPACK_IMPORTED_MODULE_4__contact_contact_component__["a" /* ContactComponent */] }
];
var AppRoutingModule = /** @class */ (function () {
    function AppRoutingModule() {
    }
    AppRoutingModule = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["I" /* NgModule */])({
            imports: [__WEBPACK_IMPORTED_MODULE_1__angular_router__["a" /* RouterModule */].forRoot(routes)],
            exports: [__WEBPACK_IMPORTED_MODULE_1__angular_router__["a" /* RouterModule */]]
        })
    ], AppRoutingModule);
    return AppRoutingModule;
}());



/***/ }),

/***/ "./src/app/app.component.css":
/***/ (function(module, exports) {

module.exports = ""

/***/ }),

/***/ "./src/app/app.component.html":
/***/ (function(module, exports) {

module.exports = "<!DOCTYPE html>\n<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n</head>\n<body>\n    <nav class=\"navbar navbar-default\">\n      <div class=\"container\">\n          <ul class=\"nav navbar-nav navbar-right\">\n            <li><a routerLink=\"/\">HOME</a></li>\n            <li><a routerLink=\"/about\">ABOUT</a></li>\n          </ul>\n          <a id=\"jumbolink\" routerLink=\"/\">\n            <div class=\"jumbotron text-center\">\n              <h1>Open Social Security</h1>\n              <p>A free, open-source Social Security strategy calculator</p>\n            </div>\n          </a>\n      </div>\n    </nav>\n\n\n      <router-outlet></router-outlet>\n</body>\n</html>\n\n"

/***/ }),

/***/ "./src/app/app.component.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return AppComponent; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("./node_modules/@angular/core/esm5/core.js");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};

var AppComponent = /** @class */ (function () {
    function AppComponent() {
    }
    AppComponent = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["n" /* Component */])({
            selector: 'app-root',
            template: __webpack_require__("./src/app/app.component.html"),
            styles: [__webpack_require__("./src/app/app.component.css")]
        })
    ], AppComponent);
    return AppComponent;
}());



/***/ }),

/***/ "./src/app/app.module.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return AppModule; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_platform_browser__ = __webpack_require__("./node_modules/@angular/platform-browser/esm5/platform-browser.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__angular_core__ = __webpack_require__("./node_modules/@angular/core/esm5/core.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__angular_forms__ = __webpack_require__("./node_modules/@angular/forms/esm5/forms.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_ngx_bootstrap__ = __webpack_require__("./node_modules/ngx-bootstrap/index.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__app_component__ = __webpack_require__("./src/app/app.component.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__input_form_input_form_component__ = __webpack_require__("./src/app/input-form/input-form.component.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__benefit_service__ = __webpack_require__("./src/app/benefit.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7__app_routing_module__ = __webpack_require__("./src/app/app-routing.module.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_8__birthday_service__ = __webpack_require__("./src/app/birthday.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_9__about_about_component__ = __webpack_require__("./src/app/about/about.component.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_10__presentvalue_service__ = __webpack_require__("./src/app/presentvalue.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_11__contact_contact_component__ = __webpack_require__("./src/app/contact/contact.component.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_12__angular_common_http__ = __webpack_require__("./node_modules/@angular/common/esm5/http.js");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};













var AppModule = /** @class */ (function () {
    function AppModule() {
    }
    AppModule = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_1__angular_core__["I" /* NgModule */])({
            declarations: [
                __WEBPACK_IMPORTED_MODULE_4__app_component__["a" /* AppComponent */],
                __WEBPACK_IMPORTED_MODULE_5__input_form_input_form_component__["a" /* InputFormComponent */],
                __WEBPACK_IMPORTED_MODULE_9__about_about_component__["a" /* AboutComponent */],
                __WEBPACK_IMPORTED_MODULE_11__contact_contact_component__["a" /* ContactComponent */]
            ],
            imports: [
                __WEBPACK_IMPORTED_MODULE_0__angular_platform_browser__["a" /* BrowserModule */],
                __WEBPACK_IMPORTED_MODULE_12__angular_common_http__["b" /* HttpClientModule */],
                __WEBPACK_IMPORTED_MODULE_2__angular_forms__["a" /* FormsModule */],
                __WEBPACK_IMPORTED_MODULE_7__app_routing_module__["a" /* AppRoutingModule */],
                __WEBPACK_IMPORTED_MODULE_3_ngx_bootstrap__["b" /* CollapseModule */].forRoot(),
                __WEBPACK_IMPORTED_MODULE_3_ngx_bootstrap__["a" /* BsDropdownModule */].forRoot()
            ],
            providers: [__WEBPACK_IMPORTED_MODULE_6__benefit_service__["a" /* BenefitService */], __WEBPACK_IMPORTED_MODULE_8__birthday_service__["a" /* BirthdayService */], __WEBPACK_IMPORTED_MODULE_10__presentvalue_service__["a" /* PresentvalueService */]],
            bootstrap: [__WEBPACK_IMPORTED_MODULE_4__app_component__["a" /* AppComponent */]]
        })
    ], AppModule);
    return AppModule;
}());



/***/ }),

/***/ "./src/app/benefit.service.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return BenefitService; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("./node_modules/@angular/core/esm5/core.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__birthday_service__ = __webpack_require__("./src/app/birthday.service.ts");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};


var BenefitService = /** @class */ (function () {
    function BenefitService(birthdayService) {
        this.birthdayService = birthdayService;
    }
    BenefitService.prototype.calculateRetirementBenefit = function (PIA, FRA, benefitDate) {
        var retirementBenefit = 0;
        var monthsWaited = benefitDate.getMonth() - FRA.getMonth() + 12 * (benefitDate.getFullYear() - FRA.getFullYear());
        if (monthsWaited < -36) {
            retirementBenefit = PIA - (PIA / 100 * 5 / 9 * 36) + (PIA / 100 * 5 / 12 * (monthsWaited + 36));
        }
        if (monthsWaited < 0 && monthsWaited >= -36) {
            retirementBenefit = PIA + (PIA / 100 * 5 / 9 * monthsWaited);
        }
        if (monthsWaited == 0) {
            retirementBenefit = PIA;
        }
        if (monthsWaited > 0) {
            retirementBenefit = PIA + (PIA / 100 * 2 / 3 * monthsWaited);
        }
        return Number(retirementBenefit);
    };
    BenefitService.prototype.calculateSpousalBenefit = function (PIA, otherSpousePIA, FRA, retirementBenefit, spousalStartDate, governmentPension) {
        //no need to check for filing prior to 62, because we're already checking for that in the input form component.
        //Initial calculation
        var spousalBenefit = otherSpousePIA / 2;
        //subtract greater of PIA or retirement benefit, but no more than spousal benefit. No subtraction if retirement benefit is zero (i.e., if not yet filed for retirement benefit)
        if (retirementBenefit > 0 && retirementBenefit >= PIA) {
            spousalBenefit = spousalBenefit - retirementBenefit;
        }
        else if (retirementBenefit > 0 && retirementBenefit < PIA) {
            spousalBenefit = spousalBenefit - PIA;
        }
        //Multiply by a reduction factor if spousal benefit claimed prior to FRA
        var monthsWaited = spousalStartDate.getMonth() - FRA.getMonth() + 12 * (spousalStartDate.getFullYear() - FRA.getFullYear());
        if (monthsWaited >= -36 && monthsWaited < 0) {
            spousalBenefit = spousalBenefit + (spousalBenefit * 25 / 36 / 100 * monthsWaited);
        }
        if (monthsWaited < -36) {
            spousalBenefit = spousalBenefit - (spousalBenefit * 25 / 36 / 100 * 36) + (spousalBenefit * 5 / 12 / 100 * (monthsWaited + 36));
        }
        //GPO: reduce by 2/3 of government pension
        spousalBenefit = spousalBenefit - 2 / 3 * governmentPension;
        //If GPO or reduction for own retirementBenefit/PIA reduced spousalBenefit below zero, spousalBenefit is zero.
        if (spousalBenefit < 0) {
            spousalBenefit = 0;
        }
        return Number(spousalBenefit);
    };
    BenefitService.prototype.calculateSurvivorBenefit = function (survivorSSbirthDate, survivorSurvivorFRA, survivorRetirementBenefit, survivorSurvivorBenefitDate, deceasedFRA, dateOfDeath, deceasedPIA, deceasedClaimingDate, governmentPension) {
        var deceasedRetirementBenefit;
        var survivorBenefit;
        //find percentage of the way survivor is from 60 to FRA
        var monthsFrom60toFRA = (survivorSurvivorFRA.getFullYear() - (survivorSSbirthDate.getFullYear() + 60)) * 12 + (survivorSurvivorFRA.getMonth() - survivorSSbirthDate.getMonth());
        var monthsElapsed = (survivorSurvivorBenefitDate.getFullYear() - (survivorSSbirthDate.getFullYear() + 60)) * 12 + (survivorSurvivorBenefitDate.getMonth() - survivorSSbirthDate.getMonth());
        var percentageWaited = monthsElapsed / monthsFrom60toFRA;
        //If deceased had filed, survivorBenefit = deceased spouse's retirement benefit, but no less than 82.5% of deceased's PIA
        if (deceasedClaimingDate <= dateOfDeath) {
            deceasedRetirementBenefit = this.calculateRetirementBenefit(deceasedPIA, deceasedFRA, deceasedClaimingDate);
            survivorBenefit = deceasedRetirementBenefit;
            if (survivorBenefit < 0.825 * deceasedPIA) {
                survivorBenefit = 0.825 * deceasedPIA;
            }
        }
        else {
            //if deceased spouse was younger than FRA, survivor benefit = deceasedPIA
            if (dateOfDeath < deceasedFRA) {
                survivorBenefit = deceasedPIA;
            }
            else {
                survivorBenefit = this.calculateRetirementBenefit(deceasedPIA, deceasedFRA, dateOfDeath);
            }
        }
        //if deceased did not file before FRA, but survivor does file for survivor benefit before FRA, adjust survivor benefit downward. (Remember to use survivor's FRA as survivor.)
        if (deceasedClaimingDate >= deceasedFRA && survivorSurvivorBenefitDate < survivorSurvivorFRA) {
            survivorBenefit = survivorBenefit - (survivorBenefit * 0.285 * (1 - percentageWaited));
        }
        //If deceased had filed before FRA, and survivor files for survivor benefit before FRA, do completely new calculation, with survivor benefit based on deceasedPIA rather than deceased retirement benefit.
        if (deceasedClaimingDate < deceasedFRA && survivorSurvivorBenefitDate < survivorSurvivorFRA) {
            survivorBenefit = deceasedPIA - (deceasedPIA * 0.285 * (1 - percentageWaited));
            console.log("survivorFRA: " + survivorSurvivorFRA);
            console.log("percentageWaited: " + percentageWaited);
            console.log("survivor benefit before limitation: " + survivorBenefit);
            //survivorBenefit then limited to greater of 82.5% of deceased's PIA or amount deceased was receiving on date of death
            if (0.825 * deceasedPIA < deceasedRetirementBenefit) {
                if (survivorBenefit > deceasedRetirementBenefit) {
                    survivorBenefit = deceasedRetirementBenefit;
                }
            }
            else {
                if (survivorBenefit > 0.825 * deceasedPIA) {
                    survivorBenefit = 0.825 * deceasedPIA;
                }
            }
        }
        //subtract own retirement benefit
        survivorBenefit = survivorBenefit - survivorRetirementBenefit;
        //GPO: reduce by 2/3 of government pension
        survivorBenefit = survivorBenefit - 2 / 3 * governmentPension;
        //If GPO or reduction for own retirement benefit reduced spousalBenefit below zero, spousalBenefit is zero.
        if (survivorBenefit < 0) {
            survivorBenefit = 0;
        }
        return Number(survivorBenefit);
    };
    BenefitService = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["A" /* Injectable */])(),
        __metadata("design:paramtypes", [__WEBPACK_IMPORTED_MODULE_1__birthday_service__["a" /* BirthdayService */]])
    ], BenefitService);
    return BenefitService;
}());



/***/ }),

/***/ "./src/app/birthday.service.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return BirthdayService; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("./node_modules/@angular/core/esm5/core.js");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};

var BirthdayService = /** @class */ (function () {
    function BirthdayService() {
    }
    BirthdayService.prototype.findSSbirthdate = function (inputMonth, inputDay, inputYear) {
        var SSbirthDate = new Date(inputYear, inputMonth - 1, 1);
        //If born on 1st of a month, birth month is prior month.
        if (inputDay == 1) {
            SSbirthDate.setMonth(SSbirthDate.getMonth() - 1);
        }
        return SSbirthDate;
    };
    BirthdayService.prototype.findFRA = function (SSbirthDate) {
        var FRAdate;
        FRAdate = new Date(SSbirthDate);
        var beginDate = new Date('January 1, 1943');
        var endDate = new Date('December 31, 1954');
        if (SSbirthDate >= beginDate && SSbirthDate <= endDate) {
            FRAdate.setMonth(FRAdate.getMonth() + 66 * 12);
        }
        beginDate = new Date('January 1, 1955');
        endDate = new Date('December 31, 1955');
        if (SSbirthDate >= beginDate && SSbirthDate <= endDate) {
            FRAdate.setMonth(FRAdate.getMonth() + 66 * 12 + 2);
        }
        beginDate = new Date('January 1, 1956');
        endDate = new Date('December 31, 1956');
        if (SSbirthDate >= beginDate && SSbirthDate <= endDate) {
            FRAdate.setMonth(FRAdate.getMonth() + 66 * 12 + 4);
        }
        beginDate = new Date('January 1, 1957');
        endDate = new Date('December 31, 1957');
        if (SSbirthDate >= beginDate && SSbirthDate <= endDate) {
            FRAdate.setMonth(FRAdate.getMonth() + 66 * 12 + 6);
        }
        beginDate = new Date('January 1, 1958');
        endDate = new Date('December 31, 1958');
        if (SSbirthDate >= beginDate && SSbirthDate <= endDate) {
            FRAdate.setMonth(FRAdate.getMonth() + 66 * 12 + 8);
        }
        beginDate = new Date('January 1, 1959');
        endDate = new Date('December 31, 1959');
        if (SSbirthDate >= beginDate && SSbirthDate <= endDate) {
            FRAdate.setMonth(FRAdate.getMonth() + 66 * 12 + 10);
        }
        beginDate = new Date('January 1, 1960');
        if (SSbirthDate >= beginDate) {
            FRAdate.setMonth(FRAdate.getMonth() + 67 * 12);
        }
        return FRAdate;
    };
    BirthdayService.prototype.findSurvivorFRA = function (SSbirthDate) {
        var madeUpDate = new Date(SSbirthDate.getFullYear() - 2, SSbirthDate.getMonth(), 1);
        var survivorFRA = new Date(this.findFRA(madeUpDate));
        survivorFRA.setFullYear(survivorFRA.getFullYear() + 2);
        return survivorFRA;
    };
    BirthdayService = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["A" /* Injectable */])(),
        __metadata("design:paramtypes", [])
    ], BirthdayService);
    return BirthdayService;
}());



/***/ }),

/***/ "./src/app/contact/contact.component.css":
/***/ (function(module, exports) {

module.exports = ""

/***/ }),

/***/ "./src/app/contact/contact.component.html":
/***/ (function(module, exports) {

module.exports = "<div class=\"container\">\n<p>You can reach me at mike@obliviousinvestor.com.</p>\n<p>\n    Please be aware though that I cannot reply to every email.\n    I'm eager to hear constructive input about the calculator, but I cannot serve as tech support, nor can I provide a personal Social Security consultation.\n</p>\n<p>If you're looking for more information about how this calculator works, you can view the source code for yourself here:</p>\n<p><a href=\"https://github.com/MikePiper/open-social-security\" target=\"_blank\">https://github.com/MikePiper/open-social-security/</a></p>\n<p>The README file, in particular, will be of interest, as it walks through the calculator's process step-by-step.</p>\n<p>If you're looking for more information about Social Security, you may find my book or blog helpful:</p>\n<ul>\n    <li><em><a href=\"https://www.amazon.com/dp/0997946512/?tag=openss-20/\" target=\"_blank\">Social Security Made Simple</a></em></li>\n    <li><a href=\"https://obliviousinvestor.com/\" target=\"_blank\">ObliviousInvestor.com</a></li>\n</ul>\n<p>You may also benefit from trying one or both of the following (paid) Social Security calculators:</p>\n<ul>\n    <li><a href=\"https://maximizemysocialsecurity.com/\" target=\"_blank\">Maximize My Social Security</a></li>\n    <li><a href=\"http://socialsecuritysolutions.com/\" target=\"blank\">Social Security Solutions</a></li>\n</ul>\n</div>"

/***/ }),

/***/ "./src/app/contact/contact.component.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return ContactComponent; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("./node_modules/@angular/core/esm5/core.js");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};

var ContactComponent = /** @class */ (function () {
    function ContactComponent() {
    }
    ContactComponent.prototype.ngOnInit = function () {
    };
    ContactComponent = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["n" /* Component */])({
            selector: 'app-contact',
            template: __webpack_require__("./src/app/contact/contact.component.html"),
            styles: [__webpack_require__("./src/app/contact/contact.component.css")]
        }),
        __metadata("design:paramtypes", [])
    ], ContactComponent);
    return ContactComponent;
}());



/***/ }),

/***/ "./src/app/input-form/input-form.component.css":
/***/ (function(module, exports) {

module.exports = ".customtooltip .tooltiptext {\n    visibility: hidden;\n    background-color: #ebf6ff;\n    color: black;\n    padding: 5px;\n    border-radius: 6px;\n    font-weight:1;\n \n    /* Position the tooltip text - see examples below! */\n    position: absolute;\n    z-index: 1;\n}\n\n.customtooltip:hover .tooltiptext {\n    visibility: visible;\n}\n\n.customtooltip {\n    border-bottom: 1px dotted black; /* Dots under the hoverable text */\n}\n"

/***/ }),

/***/ "./src/app/input-form/input-form.component.html":
/***/ (function(module, exports) {

module.exports = "<div id=\"container\" class=\"container\">\n<form #inputForm=\"ngForm\" (ngSubmit)=\"onSubmit()\">\n      <div>\n        <label for=\"advanced\">Advanced Options</label>\n        <input type=\"checkbox\" [(ngModel)]=\"advanced\" id=\"advanced\" name=\"advanced\" value=\"true\">\n      </div>\n        <h2>Your Information</h2>\n        <div class=\"form-inline\">\n          <label>Marital Status</label>\n          <select [(ngModel)]=\"maritalStatus\" name=\"maritalStatus\" class=\"form-control\">\n            <option value=\"married\">Married</option>\n            <option value=\"unmarried\">Single</option>\n          </select>\n        </div>\n        <div class=\"form-inline\">\n        <label>Gender</label>\n        <select [(ngModel)]=\"spouseAgender\" name=\"spouseAgender\" class=\"form-control\">\n          <option value=\"male\">Male</option>\n          <option value=\"female\">Female</option>\n        </select>\n        </div>\n        <div class=\"form-inline\">\n              <label>Date of Birth month/day/year</label>\n              <select class=\"form-control\" [(ngModel)]=\"spouseAinputMonth\" name=\"spouseAinputMonth\" required>\n                <option *ngFor=\"let month of inputMonths\" [value]=\"month\">{{month}}</option>\n              </select>\n              <select class=\"form-control\" [(ngModel)]=\"spouseAinputDay\" name=\"spouseAinputDay\" required>\n                  <option *ngFor=\"let day of inputDays\" [value]=\"day\">{{day}}</option>\n              </select>\n              <select class=\"form-control\" [(ngModel)]=\"spouseAinputYear\" name=\"spouseAinputYear\" required>\n                  <option *ngFor=\"let year of inputYears\" [value]=\"year\">{{year}}</option>\n              </select>\n        </div>\n        <div>\n          <label class=\"customtooltip\">PIA<span class=\"tooltiptext\">Your primary insurance amount (PIA) is the amount of your monthly retirement benefit, if you file for it at your full retirement age. You can get this information from the SSA.gov website, from your Social Security statement, or by calling the SSA.</span></label>\n          <input type=\"text\" [(ngModel)]=\"spouseAPIA\" name=\"spouseAPIA\" required>\n        </div>\n        <div *ngIf=\"this.advanced == true\">\n            <label for=\"spouseAgovernmentPension\">Monthly government pension from non-covered employment</label>\n            <input type=\"text\" [(ngModel)]=\"spouseAgovernmentPension\" id=\"spouseAgovernmentPension\" name=\"spouseAgovernmentPension\">\n        </div>\n\n      <span *ngIf=\"maritalStatus == 'married'\">\n\n        <h2>Your Spouse's Information</h2>\n        <div class=\"form-inline\">\n        <label>Gender</label>\n        <select [(ngModel)]=\"spouseBgender\" name=\"spouseBgender\" class=\"form-control\">\n          <option value=\"male\">Male</option>\n          <option value=\"female\">Female</option>\n        </select>\n        </div>\n        <div class=\"form-inline\">\n          <label>Date of Birth month/day/year</label>\n          <select class=\"form-control\" [(ngModel)]=\"spouseBinputMonth\" name=\"spouseBinputMonth\" required>\n            <option *ngFor=\"let month of inputMonths\" [value]=\"month\">{{month}}</option>\n          </select>\n          <select class=\"form-control\" [(ngModel)]=\"spouseBinputDay\" name=\"spouseBinputDay\" required>\n              <option *ngFor=\"let day of inputDays\" [value]=\"day\">{{day}}</option>\n          </select>\n          <select class=\"form-control\" [(ngModel)]=\"spouseBinputYear\" name=\"spouseBinputYear\" required>\n              <option *ngFor=\"let year of inputYears\" [value]=\"year\">{{year}}</option>\n          </select>\n        </div>\n        <div>\n          <label class=\"customtooltip\">PIA<span class=\"tooltiptext\">Your primary insurance amount (PIA) is the amount of your monthly retirement benefit, if you file for it at your full retirement age. You can get this information from the SSA.gov website, from your Social Security statement, or by calling the SSA.</span></label>\n          <input type=\"text\" [(ngModel)]=\"spouseBPIA\" name=\"spouseBPIA\" required>\n        </div>\n        <div *ngIf=\"this.advanced == true\">\n            <label for=\"spouseBgovernmentPension\">Monthly government pension from non-covered employment</label>\n            <input type=\"text\" [(ngModel)]=\"spouseBgovernmentPension\" id=\"spouseBgovernmentPension\" name=\"spouseBgovernmentPension\">\n        </div>\n      </span>\n        <div *ngIf=\"this.advanced == true\">\n          <h2>Other Inputs</h2>\n          <label class=\"customtooltip\">Real Discount Rate<span class=\"tooltiptext\">As a decimal (0.01 for a 1% discount rate, for example).</span></label>\n          <input type=\"text\" [(ngModel)]=\"discountRate\" name=\"discountRate\" required>\n        </div>\n      <div>\n        <button type=\"submit\" id=\"maximizeSubmit\" class=\"btn btn-primary\" (mousedown)=\"waitCursor()\">Submit</button>\n      </div>\n      <p *ngIf=\"!this.solutionSet.solutionPV\">If you are married, depending on your age and your computer's processor speed, this calculation may take a while -- anywhere from a few seconds to a couple of minutes. Please be patient with your computer. It's doing quite a lot of math.</p>\n</form>\n<span *ngIf=\"this.solutionSet.solutionPV\">\n  \n  <ul>\n    <li *ngIf=\"this.solutionSet.spouseAretirementSolution\">You should file for your retirement benefit to begin {{this.solutionSet.spouseAretirementSolution.getMonth()+1}}/{{this.solutionSet.spouseAretirementSolution.getFullYear()}}.</li>\n    <li *ngIf=\"this.solutionSet.spouseAspousalSolution\">You should file for your spousal benefit to begin {{this.solutionSet.spouseAspousalSolution.getMonth()+1}}/{{this.solutionSet.spouseAspousalSolution.getFullYear()}}.</li>\n    <li *ngIf=\"this.solutionSet.spouseBretirementSolution\">Your spouse should file for his/her retirement benefit to begin {{this.solutionSet.spouseBretirementSolution.getMonth()+1}}/{{this.solutionSet.spouseBretirementSolution.getFullYear()}}.</li>\n    <li *ngIf=\"this.solutionSet.spouseBspousalSolution\">Your spouse should file for his/her spousal benefit to begin {{this.solutionSet.spouseBspousalSolution.getMonth()+1}}/{{this.solutionSet.spouseBspousalSolution.getFullYear()}}.</li>\n    <li *ngIf=\"this.solutionSet.solutionPV\">The present value of this proposed solution would be {{this.solutionSet.solutionPV.toLocaleString('en-US', {style: 'currency',currency: 'USD'})}}</li>\n  </ul>\n\n  <hr>\n\n  <form #customDateForm=\"ngForm\" (ngSubmit)=\"customDates()\">\n  <h2>Test an alternative claiming strategy:</h2>\n  <div class=\"form-inline\">\n      <label>Your month/year to claim retirement benefit:</label>\n      <select class=\"form-control\" [(ngModel)]=\"spouseAretirementBenefitMonth\" name=\"spouseAretirementBenefitMonth\" required>\n        <option *ngFor=\"let month of inputMonths\" [value]=\"month\">{{month}}</option>\n      </select>\n      <select class=\"form-control\" [(ngModel)]=\"spouseAretirementBenefitYear\" name=\"spouseAretirementBenefitYear\" required>\n        <option *ngFor=\"let year of inputBenefitYears\" [value]=\"year\">{{year}}</option>\n      </select>\n      <span *ngIf=\"this.spouseAretirementDateError\" class=\"alert alert-danger\">{{this.spouseAretirementDateError}}</span>\n    </div>\n    <span *ngIf=\"maritalStatus == 'married'\">\n        <div class=\"form-inline\">\n          <label>Your month/year to claim spousal benefit:</label>\n          <select class=\"form-control\" [(ngModel)]=\"spouseAspousalBenefitMonth\" name=\"spouseAspousalBenefitMonth\" required>\n            <option *ngFor=\"let month of inputMonths\" [value]=\"month\">{{month}}</option>\n          </select>\n          <select class=\"form-control\" [(ngModel)]=\"spouseAspousalBenefitYear\" name=\"spouseAspousalBenefitYear\" required>\n            <option *ngFor=\"let year of inputBenefitYears\" [value]=\"year\">{{year}}</option>\n          </select>\n          <span *ngIf=\"this.spouseAspousalDateError\" class=\"alert alert-danger\">{{this.spouseAspousalDateError}}</span>\n        </div>\n        <div class=\"form-inline\">\n            <label>Your spouse's month/year to claim retirement benefit:</label>\n            <select class=\"form-control\" [(ngModel)]=\"spouseBretirementBenefitMonth\" name=\"spouseBretirementBenefitMonth\" required>\n              <option *ngFor=\"let month of inputMonths\" [value]=\"month\">{{month}}</option>\n            </select>\n            <select class=\"form-control\" [(ngModel)]=\"spouseBretirementBenefitYear\" name=\"spouseBretirementBenefitYear\" required>\n              <option *ngFor=\"let year of inputBenefitYears\" [value]=\"year\">{{year}}</option>\n            </select>\n            <span *ngIf=\"this.spouseBretirementDateError\" class=\"alert alert-danger\">{{this.spouseBretirementDateError}}</span>\n          </div>\n          <div class=\"form-inline\">\n            <label>Your spouse's month/year to claim spousal benefit:</label>\n            <select class=\"form-control\" [(ngModel)]=\"spouseBspousalBenefitMonth\" name=\"spouseBspousalBenefitMonth\" required>\n              <option *ngFor=\"let month of inputMonths\" [value]=\"month\">{{month}}</option>\n            </select>\n            <select class=\"form-control\" [(ngModel)]=\"spouseBspousalBenefitYear\" name=\"spouseBspousalBenefitYear\" required>\n              <option *ngFor=\"let year of inputBenefitYears\" [value]=\"year\">{{year}}</option>\n            </select>\n            <span *ngIf=\"this.spouseBspousalDateError\" class=\"alert alert-danger\">{{this.spouseBspousalDateError}}</span>\n          </div>\n      </span>\n    <div>\n        <button type=\"submit\" class=\"btn btn-primary\">Submit</button>\n    </div>\n    <span *ngIf=\"this.customPV\">\n      The present value of the strategy you selected is {{this.customPV.toLocaleString('en-US', {style: 'currency',currency: 'USD'})}}, as compared to a present value of {{this.solutionSet.solutionPV.toLocaleString('en-US', {style: 'currency',currency: 'USD'})}} from the recommended strategy.\n    </span>\n  </form>\n</span>\n</div>"

/***/ }),

/***/ "./src/app/input-form/input-form.component.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return InputFormComponent; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("./node_modules/@angular/core/esm5/core.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__angular_common_http__ = __webpack_require__("./node_modules/@angular/common/esm5/http.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__benefit_service__ = __webpack_require__("./src/app/benefit.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__birthday_service__ = __webpack_require__("./src/app/birthday.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__presentvalue_service__ = __webpack_require__("./src/app/presentvalue.service.ts");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};





var InputFormComponent = /** @class */ (function () {
    function InputFormComponent(benefitService, birthdayService, presentvalueService, http) {
        this.benefitService = benefitService;
        this.birthdayService = birthdayService;
        this.presentvalueService = presentvalueService;
        this.http = http;
        this.today = new Date();
        //Variables to make form work
        this.inputMonths = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        this.inputDays = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
            16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31];
        this.inputYears = [1947, 1948, 1949,
            1950, 1951, 1952, 1953, 1954, 1955, 1956, 1957, 1958, 1959,
            1960, 1961, 1962, 1963, 1964, 1965, 1966, 1967, 1968, 1969,
            1970, 1971, 1972, 1973, 1974, 1975, 1976, 1977, 1978, 1979,
            1980, 1981, 1982, 1983, 1984, 1985, 1986, 1987, 1988, 1989,
            1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999,
            2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009,
            2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018
        ];
        this.inputBenefitYears = [2014, 2015, 2016, 2017, 2018, 2019,
            2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029,
            2030, 2031, 2032, 2033, 2034, 2035, 2036, 2037, 2038, 2039,
            2040, 2041, 2042, 2043, 2044, 2045, 2046, 2047, 2048, 2049,
            2050, 2051, 2052, 2053, 2054, 2055, 2056, 2057, 2058, 2059,
            2060];
        //Inputs from form
        this.maritalStatus = "unmarried";
        this.spouseAinputMonth = 4;
        this.spouseAinputDay = 8;
        this.spouseAinputYear = 1984;
        this.spouseAPIA = 1000;
        this.spouseAretirementBenefitMonth = 4;
        this.spouseAretirementBenefitYear = 2051;
        this.spouseAspousalBenefitMonth = 4;
        this.spouseAspousalBenefitYear = 2051;
        this.spouseAgender = "male";
        this.spouseBinputMonth = 4;
        this.spouseBinputDay = 28;
        this.spouseBinputYear = 1984;
        this.spouseBPIA = 1000;
        this.spouseBretirementBenefitMonth = 4;
        this.spouseBretirementBenefitYear = 2051;
        this.spouseBspousalBenefitMonth = 4;
        this.spouseBspousalBenefitYear = 2051;
        this.spouseBgender = "female";
        this.discountRate = 0.01;
        this.advanced = false;
        this.spouseAgovernmentPension = 0;
        this.spouseBgovernmentPension = 0;
        this.solutionSet = {};
    }
    InputFormComponent.prototype.ngOnInit = function () {
    };
    InputFormComponent.prototype.onSubmit = function () {
        var startTime = performance.now(); //for testing performance
        console.log("-------------");
        this.spouseAactualBirthDate = new Date(this.spouseAinputYear, this.spouseAinputMonth - 1, this.spouseAinputDay);
        this.spouseASSbirthDate = new Date(this.birthdayService.findSSbirthdate(this.spouseAinputMonth, this.spouseAinputDay, this.spouseAinputYear));
        this.spouseAFRA = new Date(this.birthdayService.findFRA(this.spouseASSbirthDate));
        this.spouseAsurvivorFRA = new Date(this.birthdayService.findSurvivorFRA(this.spouseASSbirthDate));
        this.spouseBactualBirthDate = new Date(this.spouseBinputYear, this.spouseBinputMonth - 1, this.spouseBinputDay);
        this.spouseBSSbirthDate = new Date(this.birthdayService.findSSbirthdate(this.spouseBinputMonth, this.spouseBinputDay, this.spouseBinputYear));
        this.spouseBFRA = new Date(this.birthdayService.findFRA(this.spouseBSSbirthDate));
        this.spouseBsurvivorFRA = new Date(this.birthdayService.findSurvivorFRA(this.spouseBSSbirthDate));
        this.spouseAage = (this.today.getMonth() - this.spouseASSbirthDate.getMonth() + 12 * (this.today.getFullYear() - this.spouseASSbirthDate.getFullYear())) / 12;
        this.spouseBage = (this.today.getMonth() - this.spouseBSSbirthDate.getMonth() + 12 * (this.today.getFullYear() - this.spouseBSSbirthDate.getFullYear())) / 12;
        this.spouseAageRounded = Math.round(this.spouseAage);
        this.spouseBageRounded = Math.round(this.spouseBage);
        if (this.maritalStatus == "unmarried") {
            this.solutionSet = this.presentvalueService.maximizeSinglePersonPV(Number(this.spouseAPIA), this.spouseASSbirthDate, this.spouseAactualBirthDate, this.spouseAage, this.spouseAFRA, this.spouseAgender, Number(this.discountRate));
        }
        if (this.maritalStatus == "married") {
            this.solutionSet = this.presentvalueService.maximizeCouplePV(Number(this.spouseAPIA), Number(this.spouseBPIA), this.spouseAactualBirthDate, this.spouseBactualBirthDate, this.spouseASSbirthDate, this.spouseBSSbirthDate, Number(this.spouseAageRounded), Number(this.spouseBageRounded), this.spouseAFRA, this.spouseBFRA, this.spouseAsurvivorFRA, this.spouseBsurvivorFRA, this.spouseAgender, this.spouseBgender, Number(this.spouseAgovernmentPension), Number(this.spouseBgovernmentPension), Number(this.discountRate));
        }
        this.normalCursor();
        //For testing performance
        var endTime = performance.now();
        var elapsed = (endTime - startTime) / 1000;
        console.log("Time elapsed: " + elapsed);
    };
    InputFormComponent.prototype.customDates = function () {
        //TODO: Get all the normal inputs from above, calc SSbirthdates, FRAs, etc.
        this.spouseAactualBirthDate = new Date(this.spouseAinputYear, this.spouseAinputMonth - 1, this.spouseAinputDay);
        this.spouseASSbirthDate = new Date(this.birthdayService.findSSbirthdate(this.spouseAinputMonth, this.spouseAinputDay, this.spouseAinputYear));
        this.spouseAFRA = new Date(this.birthdayService.findFRA(this.spouseASSbirthDate));
        this.spouseAsurvivorFRA = new Date(this.birthdayService.findSurvivorFRA(this.spouseASSbirthDate));
        this.spouseBactualBirthDate = new Date(this.spouseBinputYear, this.spouseBinputMonth - 1, this.spouseBinputDay);
        this.spouseBSSbirthDate = new Date(this.birthdayService.findSSbirthdate(this.spouseBinputMonth, this.spouseBinputDay, this.spouseBinputYear));
        this.spouseBFRA = new Date(this.birthdayService.findFRA(this.spouseBSSbirthDate));
        this.spouseBsurvivorFRA = new Date(this.birthdayService.findSurvivorFRA(this.spouseBSSbirthDate));
        this.spouseAage = (this.today.getMonth() - this.spouseASSbirthDate.getMonth() + 12 * (this.today.getFullYear() - this.spouseASSbirthDate.getFullYear())) / 12;
        this.spouseBage = (this.today.getMonth() - this.spouseBSSbirthDate.getMonth() + 12 * (this.today.getFullYear() - this.spouseBSSbirthDate.getFullYear())) / 12;
        this.spouseAageRounded = Math.round(this.spouseAage);
        this.spouseBageRounded = Math.round(this.spouseBage);
        //Get input benefit dates
        this.spouseAretirementBenefitDate = new Date(this.spouseAretirementBenefitYear, this.spouseAretirementBenefitMonth - 1, 1);
        this.spouseAspousalBenefitDate = new Date(this.spouseAspousalBenefitYear, this.spouseAspousalBenefitMonth - 1, 1);
        this.spouseBretirementBenefitDate = new Date(this.spouseBretirementBenefitYear, this.spouseBretirementBenefitMonth - 1, 1);
        this.spouseBspousalBenefitDate = new Date(this.spouseBspousalBenefitYear, this.spouseBspousalBenefitMonth - 1, 1);
        this.spouseAretirementDateError = this.checkValidRetirementInputs(this.spouseAFRA, this.spouseASSbirthDate, this.spouseAactualBirthDate, this.spouseAretirementBenefitDate);
        this.spouseBretirementDateError = this.checkValidRetirementInputs(this.spouseBFRA, this.spouseBSSbirthDate, this.spouseBactualBirthDate, this.spouseBretirementBenefitDate);
        this.spouseAspousalDateError = this.checkValidSpousalInputs(this.spouseAFRA, this.spouseAactualBirthDate, this.spouseASSbirthDate, this.spouseAretirementBenefitDate, this.spouseAspousalBenefitDate, this.spouseBretirementBenefitDate);
        this.spouseBspousalDateError = this.checkValidSpousalInputs(this.spouseBFRA, this.spouseBactualBirthDate, this.spouseBSSbirthDate, this.spouseBretirementBenefitDate, this.spouseBspousalBenefitDate, this.spouseAretirementBenefitDate);
        //Calc PV with input dates
        if (this.maritalStatus == "unmarried" && !this.spouseAretirementDateError) {
            this.customPV = this.presentvalueService.calculateSinglePersonPV(this.spouseAFRA, this.spouseASSbirthDate, Number(this.spouseAage), Number(this.spouseAPIA), this.spouseAretirementBenefitDate, this.spouseAgender, Number(this.discountRate));
        }
        if (this.maritalStatus == "married" && !this.spouseAretirementDateError && !this.spouseBretirementDateError && !this.spouseBspousalDateError && !this.spouseAspousalDateError) {
            this.customPV = this.presentvalueService.calculateCouplePV(this.spouseAgender, this.spouseBgender, this.spouseASSbirthDate, this.spouseBSSbirthDate, Number(this.spouseAageRounded), Number(this.spouseBageRounded), this.spouseAFRA, this.spouseBFRA, this.spouseAsurvivorFRA, this.spouseBsurvivorFRA, Number(this.spouseAPIA), Number(this.spouseBPIA), this.spouseAretirementBenefitDate, this.spouseBretirementBenefitDate, this.spouseAspousalBenefitDate, this.spouseBspousalBenefitDate, Number(this.spouseAgovernmentPension), Number(this.spouseBgovernmentPension), Number(this.discountRate));
        }
    };
    InputFormComponent.prototype.checkValidRetirementInputs = function (FRA, SSbirthDate, actualBirthDate, retirementBenefitDate) {
        var error = undefined;
        //Validation to make sure they are not filing for benefits in the past
        if ((retirementBenefitDate.getFullYear() < this.today.getFullYear()) || (retirementBenefitDate.getFullYear() == this.today.getFullYear() && (retirementBenefitDate.getMonth() < this.today.getMonth()))) {
            error = "Please enter a date no earlier than this month.";
        }
        //Validation in case they try to start benefit earlier than possible or after 70
        var earliestDate = new Date(SSbirthDate.getFullYear() + 62, 1, 1);
        if (actualBirthDate.getDate() <= 2) {
            earliestDate.setMonth(actualBirthDate.getMonth());
        }
        else {
            earliestDate.setMonth(actualBirthDate.getMonth() + 1);
        }
        if (retirementBenefitDate < earliestDate) {
            error = "Please enter a later date. You cannot file for retirement benefits before the first month in which you are 62 for the entire month.";
        }
        var latestDate = new Date(SSbirthDate.getFullYear() + 70, SSbirthDate.getMonth(), 1);
        if (retirementBenefitDate > latestDate) {
            error = "Please enter an earlier date. You do not want to wait beyond age 70.";
        }
        return error;
    };
    InputFormComponent.prototype.checkValidSpousalInputs = function (FRA, actualBirthDate, SSbirthDate, ownRetirementBenefitDate, spousalBenefitDate, otherSpouseRetirementBenefitDate) {
        var error = undefined;
        var deemedFilingCutoff = new Date(1954, 0, 1);
        var secondStartDate = new Date(1, 1, 1);
        //TODO: Needs validation for spousal benefit before retirement benefit if deemed filing should apply (i.e., under 62 on 1/1/2016 or if under FRA on input age for claiming spousal)
        if (actualBirthDate < deemedFilingCutoff) {
            if (spousalBenefitDate < FRA && (spousalBenefitDate.getMonth() !== ownRetirementBenefitDate.getMonth() || spousalBenefitDate.getFullYear() !== ownRetirementBenefitDate.getFullYear())) {
                error = "You can't file a restricted application for just spousal benefits prior to your FRA.";
            }
        }
        else {
            if (ownRetirementBenefitDate < otherSpouseRetirementBenefitDate) {
                secondStartDate.setFullYear(otherSpouseRetirementBenefitDate.getFullYear());
                secondStartDate.setMonth(otherSpouseRetirementBenefitDate.getMonth());
            }
            else {
                secondStartDate.setFullYear(ownRetirementBenefitDate.getFullYear());
                secondStartDate.setMonth(ownRetirementBenefitDate.getMonth());
            }
            if (spousalBenefitDate.getMonth() !== secondStartDate.getMonth() || spousalBenefitDate.getFullYear() !== secondStartDate.getFullYear()) {
                error = "Invalid spousal benefit date per new deemed filing rules";
            }
        }
        //Validation to make sure they are not filing for benefits in the past
        if ((spousalBenefitDate.getFullYear() < this.today.getFullYear()) || (spousalBenefitDate.getFullYear() == this.today.getFullYear() && (spousalBenefitDate.getMonth() < this.today.getMonth()))) {
            error = "Please enter a date no earlier than this month.";
        }
        //Validation in case they try to start benefit earlier than possible. (Just ignoring the "must be 62 for entire month" rule right now.) (No validation check for after age 70, because sometimes that will be earliest they can -- if they're much younger than other spouse.)
        var claimingAge = (spousalBenefitDate.getMonth() - SSbirthDate.getMonth() + 12 * (spousalBenefitDate.getFullYear() - SSbirthDate.getFullYear())) / 12;
        if (claimingAge < 61.99) {
            error = "Please enter a later date. You cannot file for spousal benefits before age 62.";
        }
        //Validation in case they try to start spousal benefit before other spouse's retirement benefit.
        if (spousalBenefitDate < otherSpouseRetirementBenefitDate) {
            error = "You cannot start your spousal benefit before your spouse has filed for his/her own retirement benefit.";
        }
        return error;
    };
    InputFormComponent.prototype.waitCursor = function () {
        document.getElementById("container").style.cursor = "wait";
        document.getElementById("maximizeSubmit").style.cursor = "wait";
    };
    InputFormComponent.prototype.normalCursor = function () {
        document.getElementById("container").style.cursor = "default";
        document.getElementById("maximizeSubmit").style.cursor = "default";
    };
    InputFormComponent = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["n" /* Component */])({
            selector: 'app-input-form',
            template: __webpack_require__("./src/app/input-form/input-form.component.html"),
            styles: [__webpack_require__("./src/app/input-form/input-form.component.css")]
        }),
        __metadata("design:paramtypes", [__WEBPACK_IMPORTED_MODULE_2__benefit_service__["a" /* BenefitService */], __WEBPACK_IMPORTED_MODULE_3__birthday_service__["a" /* BirthdayService */], __WEBPACK_IMPORTED_MODULE_4__presentvalue_service__["a" /* PresentvalueService */], __WEBPACK_IMPORTED_MODULE_1__angular_common_http__["a" /* HttpClient */]])
    ], InputFormComponent);
    return InputFormComponent;
}());



/***/ }),

/***/ "./src/app/presentvalue.service.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return PresentvalueService; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("./node_modules/@angular/core/esm5/core.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__birthday_service__ = __webpack_require__("./src/app/birthday.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__benefit_service__ = __webpack_require__("./src/app/benefit.service.ts");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};



var PresentvalueService = /** @class */ (function () {
    function PresentvalueService(benefitService, birthdayService) {
        this.benefitService = benefitService;
        this.birthdayService = birthdayService;
        this.today = new Date();
        //Lives remaining out of 100k, from SSA 2014 period life table
        this.maleLivesRemaining = [
            100000,
            99368,
            99328,
            99300,
            99279,
            99261,
            99245,
            99231,
            99218,
            99206,
            99197,
            99187,
            99177,
            99164,
            99144,
            99114,
            99074,
            99024,
            98963,
            98889,
            98802,
            98701,
            98588,
            98464,
            98335,
            98204,
            98072,
            97937,
            97801,
            97662,
            97520,
            97373,
            97224,
            97071,
            96914,
            96753,
            96587,
            96415,
            96236,
            96050,
            95856,
            95653,
            95437,
            95207,
            94958,
            94688,
            94394,
            94073,
            93721,
            93336,
            92913,
            92449,
            91943,
            91392,
            90792,
            90142,
            89439,
            88681,
            87867,
            87001,
            86081,
            85104,
            84065,
            82967,
            81812,
            80600,
            79324,
            77977,
            76550,
            75036,
            73427,
            71710,
            69878,
            67930,
            65866,
            63686,
            61377,
            58930,
            56344,
            53625,
            50776,
            47795,
            44685,
            41461,
            38148,
            34771,
            31358,
            27943,
            24565,
            21270,
            18107,
            15128,
            12381,
            9906,
            7733,
            5878,
            4348,
            3130,
            2194,
            1500,
            1001,
            652,
            413,
            254,
            151,
            87,
            48,
            26,
            13,
            6,
            3,
            1,
            1,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
        ];
        this.femaleLivesRemaining = [
            100000,
            99469,
            99434,
            99412,
            99396,
            99383,
            99372,
            99361,
            99351,
            99342,
            99334,
            99325,
            99317,
            99307,
            99294,
            99279,
            99260,
            99237,
            99210,
            99180,
            99146,
            99109,
            99069,
            99025,
            98978,
            98929,
            98877,
            98822,
            98765,
            98705,
            98641,
            98575,
            98505,
            98431,
            98351,
            98266,
            98175,
            98076,
            97970,
            97856,
            97735,
            97604,
            97463,
            97311,
            97146,
            96966,
            96771,
            96559,
            96327,
            96072,
            95794,
            95488,
            95155,
            94794,
            94405,
            93987,
            93539,
            93057,
            92542,
            91997,
            91420,
            90809,
            90157,
            89461,
            88715,
            87914,
            87049,
            86114,
            85102,
            84006,
            82818,
            81525,
            80117,
            78591,
            76947,
            75182,
            73280,
            71225,
            69008,
            66621,
            64059,
            61304,
            58350,
            55213,
            51913,
            48467,
            44889,
            41191,
            37394,
            33531,
            29650,
            25811,
            22083,
            18536,
            15240,
            12250,
            9620,
            7378,
            5525,
            4043,
            2893,
            2021,
            1375,
            909,
            583,
            361,
            215,
            123,
            67,
            35,
            17,
            8,
            3,
            1,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
        ];
    }
    PresentvalueService.prototype.calculateSinglePersonPV = function (FRA, SSbirthDate, initialAge, PIA, inputBenefitDate, gender, discountRate) {
        var retirementBenefit = this.benefitService.calculateRetirementBenefit(PIA, FRA, inputBenefitDate);
        var retirementPV = 0;
        var roundedAge = 0;
        var probabilityAlive = 0;
        //calculate age when they start benefit
        var age = (inputBenefitDate.getMonth() - (SSbirthDate.getMonth()) + 12 * (inputBenefitDate.getFullYear() - SSbirthDate.getFullYear())) / 12;
        //calculate age when filling out form
        var today = new Date();
        var initialAgeRounded = Math.round(initialAge);
        var discountTargetAge;
        //Calculate PV via loop until they hit age 118 (by which point "remaining lives" is zero)
        while (age < 115) {
            //When calculating probability alive, we have to round age to get a whole number to use for lookup in array.
            //Normally we round age down and use that number for the whole year. But sometimes, for example, real age will be 66 but javascript sees it as 65.99999, so we have to round that up.
            if (age % 1 > 0.999) {
                roundedAge = Math.round(age);
            }
            else {
                roundedAge = Math.floor(age);
            }
            //Calculate probability of being alive at age in question.
            if (initialAgeRounded <= 62) {
                if (gender == "male") {
                    probabilityAlive = this.maleLivesRemaining[roundedAge + 1] / this.maleLivesRemaining[62];
                }
                if (gender == "female") {
                    probabilityAlive = this.femaleLivesRemaining[roundedAge + 1] / this.femaleLivesRemaining[62];
                }
            }
            else {
                if (gender == "male") {
                    probabilityAlive = this.maleLivesRemaining[roundedAge + 1] / this.maleLivesRemaining[initialAgeRounded];
                }
                if (gender == "female") {
                    probabilityAlive = this.femaleLivesRemaining[roundedAge + 1] / this.femaleLivesRemaining[initialAgeRounded];
                }
            }
            //Calculate probability-weighted benefit
            var monthlyPV = retirementBenefit * probabilityAlive;
            //Discount that benefit to age 62
            monthlyPV = monthlyPV / (1 + discountRate / 2); //e.g., benefits received during age 62 must be discounted for 0.5 years
            monthlyPV = monthlyPV / Math.pow((1 + discountRate), (roundedAge - 62)); //e.g., benefits received during age 63 must be discounted for 1.5 years
            //Add discounted benefit to ongoing count of retirementPV, add 1 month to age, and start loop over
            retirementPV = retirementPV + monthlyPV;
            age = age + 1 / 12;
        }
        return retirementPV;
    };
    PresentvalueService.prototype.calculateCouplePV = function (spouseAgender, spouseBgender, spouseASSbirthDate, spouseBSSbirthDate, spouseAinitialAgeRounded, spouseBinitialAgeRounded, spouseAFRA, spouseBFRA, spouseAsurvivorFRA, spouseBsurvivorFRA, spouseAPIA, spouseBPIA, spouseAretirementBenefitDate, spouseBretirementBenefitDate, spouseAspousalBenefitDate, spouseBspousalBenefitDate, spouseAgovernmentPension, spouseBgovernmentPension, discountRate) {
        var spouseAretirementBenefit = 0;
        var spouseBretirementBenefit = 0;
        var spouseAspousalBenefit;
        var spouseBspousalBenefit;
        var spouseAsurvivorBenefit = 0;
        var spouseBsurvivorBenefit = 0;
        var spouseAage;
        var spouseAroundedAge;
        var probabilityAalive;
        var spouseBage;
        var spouseBroundedAge;
        var probabilityBalive;
        var couplePV = 0;
        var firstStartDate;
        var secondStartDate;
        //If spouse A's input benefit date earlier, set firstStartDate and secondStartDate accordingly.
        if (spouseAretirementBenefitDate < spouseBretirementBenefitDate) {
            firstStartDate = new Date(spouseAretirementBenefitDate);
            secondStartDate = new Date(spouseBretirementBenefitDate);
        }
        else {
            firstStartDate = new Date(spouseBretirementBenefitDate);
            secondStartDate = new Date(spouseAretirementBenefitDate);
        }
        //Find age of each spouse as of firstStartDate
        spouseAage = (firstStartDate.getMonth() - spouseASSbirthDate.getMonth() + 12 * (firstStartDate.getFullYear() - spouseASSbirthDate.getFullYear())) / 12;
        spouseBage = (firstStartDate.getMonth() - spouseBSSbirthDate.getMonth() + 12 * (firstStartDate.getFullYear() - spouseBSSbirthDate.getFullYear())) / 12;
        //Calculate PV via loop until both spouses are at least age 115 (by which point "remaining lives" alive is zero)
        var currentTestDate = new Date(firstStartDate);
        while (spouseAage < 115 || spouseBage < 115) {
            //Retirement benefit A is zero if currentTestDate is prior to spouseAinputBenefitDate. Otherwise retirement benefit A is calculated as of spouseAinputBenefitDate.
            if (currentTestDate < spouseAretirementBenefitDate) {
                spouseAretirementBenefit = 0;
            }
            else {
                spouseAretirementBenefit = this.benefitService.calculateRetirementBenefit(spouseAPIA, spouseAFRA, spouseAretirementBenefitDate);
            }
            //Retirement benefit B is zero if currentTestDate is prior to spouseBinputBenefitDate. Otherwise retirement benefit B is calculated as of spouseBinputBenefitDate.
            if (currentTestDate < spouseBretirementBenefitDate) {
                spouseBretirementBenefit = 0;
            }
            else {
                spouseBretirementBenefit = this.benefitService.calculateRetirementBenefit(spouseBPIA, spouseBFRA, spouseBretirementBenefitDate);
            }
            //Calculate spousal benefits (zero if before applicable claiming date). Don't need to check here if other spouse has filed for retirement benefit yet, because that's being done with input validation.
            if (currentTestDate < spouseAspousalBenefitDate) {
                spouseAspousalBenefit = 0;
            }
            else {
                spouseAspousalBenefit = this.benefitService.calculateSpousalBenefit(spouseAPIA, spouseBPIA, spouseAFRA, spouseAretirementBenefit, spouseAspousalBenefitDate, spouseAgovernmentPension);
            }
            if (currentTestDate < spouseBspousalBenefitDate) {
                spouseBspousalBenefit = 0;
            }
            else {
                spouseBspousalBenefit = this.benefitService.calculateSpousalBenefit(spouseBPIA, spouseAPIA, spouseBFRA, spouseBretirementBenefit, spouseBspousalBenefitDate, spouseBgovernmentPension);
            }
            //Survivor benefits are zero before survivorFRA, after survivorFRA, calculate each spouse's survivor benefit using other spouse's intended claiming age as their date of death. (That is, assuming that other spouse lives to their intended claiming age.)
            if (currentTestDate < spouseAsurvivorFRA) {
                spouseAsurvivorBenefit = 0; //<-- This will get changed when we incorporate restricted applications for survivor benefits
            }
            else {
                spouseAsurvivorBenefit = this.benefitService.calculateSurvivorBenefit(spouseASSbirthDate, spouseAsurvivorFRA, spouseAretirementBenefit, spouseAsurvivorFRA, spouseBFRA, spouseBretirementBenefitDate, spouseBPIA, spouseBretirementBenefitDate, spouseAgovernmentPension);
            }
            if (currentTestDate < spouseBsurvivorFRA) {
                spouseBsurvivorBenefit = 0; //<-- This will get changed when we incorporate restricted applications for survivor benefits
            }
            else {
                spouseBsurvivorBenefit = this.benefitService.calculateSurvivorBenefit(spouseBSSbirthDate, spouseBsurvivorFRA, spouseBretirementBenefit, spouseBsurvivorFRA, spouseAFRA, spouseAretirementBenefitDate, spouseAPIA, spouseAretirementBenefitDate, spouseBgovernmentPension);
            }
            //Calculate probability of spouseA being alive at given age
            //When calculating probability alive, we have to round age to get a whole number to use for lookup in array.
            //Normally we round age down and use that number for the whole year. But sometimes, for example, real age will be 66 but javascript sees it as 65.99999, so we have to round that up.
            if (spouseAage % 1 > 0.99) {
                spouseAroundedAge = Math.round(spouseAage);
            }
            else {
                spouseAroundedAge = Math.floor(spouseAage);
            }
            //Calculate probability of being alive at age in question.
            if (spouseAinitialAgeRounded <= 62) {
                if (spouseAgender == "male") {
                    probabilityAalive = this.maleLivesRemaining[spouseAroundedAge + 1] / this.maleLivesRemaining[62];
                }
                if (spouseAgender == "female") {
                    probabilityAalive = this.femaleLivesRemaining[spouseAroundedAge + 1] / this.femaleLivesRemaining[62];
                }
            }
            else {
                if (spouseAgender == "male") {
                    probabilityAalive = this.maleLivesRemaining[spouseAroundedAge + 1] / this.maleLivesRemaining[spouseAinitialAgeRounded];
                }
                if (spouseAgender == "female") {
                    probabilityAalive = this.femaleLivesRemaining[spouseAroundedAge + 1] / this.femaleLivesRemaining[spouseAinitialAgeRounded];
                }
            }
            //Do same math to calculate probability of spouseB being alive at given age
            //calculate rounded age
            if (spouseBage % 1 > 0.99) {
                spouseBroundedAge = Math.round(spouseBage);
            }
            else {
                spouseBroundedAge = Math.floor(spouseBage);
            }
            //use rounded age and lives remaining array to calculate probability
            if (spouseBinitialAgeRounded <= 62) {
                if (spouseBgender == "male") {
                    probabilityBalive = this.maleLivesRemaining[spouseBroundedAge + 1] / this.maleLivesRemaining[62];
                }
                if (spouseBgender == "female") {
                    probabilityBalive = this.femaleLivesRemaining[spouseBroundedAge + 1] / this.femaleLivesRemaining[62];
                }
            }
            else {
                if (spouseBgender == "male") {
                    probabilityBalive = this.maleLivesRemaining[spouseBroundedAge + 1] / this.maleLivesRemaining[spouseBinitialAgeRounded];
                }
                if (spouseBgender == "female") {
                    probabilityBalive = this.femaleLivesRemaining[spouseBroundedAge + 1] / this.femaleLivesRemaining[spouseBinitialAgeRounded];
                }
            }
            //Find probability-weighted benefit
            var monthlyPV = (probabilityAalive * (1 - probabilityBalive) * (spouseAretirementBenefit + spouseAsurvivorBenefit)) //Scenario where A is alive, B is deceased
                + (probabilityBalive * (1 - probabilityAalive) * (spouseBretirementBenefit + spouseBsurvivorBenefit)) //Scenario where B is alive, A is deceased
                + ((probabilityAalive * probabilityBalive) * (spouseAretirementBenefit + spouseAspousalBenefit + spouseBretirementBenefit + spouseBspousalBenefit)); //Scenario where both are alive
            //Discount that benefit
            //Find which spouse is older, because we're discounting back to date on which older spouse is age 62.
            var olderRoundedAge = void 0;
            if (spouseAage > spouseBage) {
                olderRoundedAge = spouseAroundedAge;
            }
            else {
                olderRoundedAge = spouseBroundedAge;
            }
            //Here is where actual discounting happens. Discounting by half a year, because we assume all benefits received mid-year. Then discounting for any additional years needed to get back to PV at 62.
            monthlyPV = monthlyPV / (1 + discountRate / 2) / Math.pow((1 + discountRate), (olderRoundedAge - 62));
            /*log benefit amounts by date
            console.log("currentTestDate: " + currentTestDate)
            console.log("spouseAretirementBenefit: " + spouseAretirementBenefit)
            console.log("spouseBretirementBenefit: " + spouseBretirementBenefit)
            console.log("spouseAspousalBenefit: " + spouseAspousalBenefit)
            console.log("spouseBspousalBenefit: " + spouseBspousalBenefit)
            */
            //Add discounted benefit to ongoing count of retirementPV, add 1 month to each age, add 1 month to currentTestDate, and start loop over
            couplePV = couplePV + monthlyPV;
            spouseAage = spouseAage + 1 / 12;
            spouseBage = spouseBage + 1 / 12;
            currentTestDate.setMonth(currentTestDate.getMonth() + 1);
        }
        return couplePV;
    };
    PresentvalueService.prototype.maximizeSinglePersonPV = function (PIA, SSbirthDate, actualBirthDate, initialAge, FRA, gender, discountRate) {
        //find initial currentTestDate for age 62
        var currentTestDate = new Date(SSbirthDate.getFullYear() + 62, 1, 1);
        if (actualBirthDate.getDate() <= 2) {
            currentTestDate.setMonth(actualBirthDate.getMonth());
        }
        else {
            currentTestDate.setMonth(actualBirthDate.getMonth() + 1);
        }
        //If they are currently over age 62 when filling out form, set currentTestDate to today's month/year instead of their age 62 month/year, so that calc starts today instead of 62.
        var ageToday = this.today.getFullYear() - SSbirthDate.getFullYear() + (this.today.getMonth() - SSbirthDate.getMonth()) / 12;
        if (ageToday > 62) {
            currentTestDate.setMonth(this.today.getMonth());
            currentTestDate.setFullYear(this.today.getFullYear());
        }
        //Run calculateSinglePersonPV for their earliest possible claiming date, save the PV and the date.
        var savedPV = this.calculateSinglePersonPV(FRA, SSbirthDate, initialAge, PIA, currentTestDate, gender, discountRate);
        var savedClaimingDate = new Date(currentTestDate);
        //Set endingTestDate equal to the month before they turn 70 (because loop starts with adding a month and then testing new values)
        var endingTestDate = new Date(SSbirthDate.getFullYear() + 70, SSbirthDate.getMonth() - 1, 1);
        while (currentTestDate <= endingTestDate) {
            //Add 1 month to claiming age and run both calculations again and compare results. Save better of the two.
            currentTestDate.setMonth(currentTestDate.getMonth() + 1);
            var currentTestPV = this.calculateSinglePersonPV(FRA, SSbirthDate, initialAge, PIA, currentTestDate, gender, discountRate);
            if (currentTestPV > savedPV) {
                savedClaimingDate.setMonth(currentTestDate.getMonth());
                savedClaimingDate.setFullYear(currentTestDate.getFullYear());
                savedPV = currentTestPV;
            }
        }
        //after loop is finished
        console.log("saved PV: " + savedPV);
        console.log("savedClaimingDate: " + savedClaimingDate);
        var solutionSet = {
            "solutionPV": savedPV,
            "spouseAretirementSolution": savedClaimingDate,
            "spouseBretirementSolution": null,
            "spouseAspousalSolution": null,
            "spouseBspousalSolution": null
        };
        return solutionSet;
    };
    PresentvalueService.prototype.maximizeCouplePV = function (spouseAPIA, spouseBPIA, spouseAactualBirthDate, spouseBactualBirthDate, spouseASSbirthDate, spouseBSSbirthDate, spouseAinitialAgeRounded, spouseBinitialAgeRounded, spouseAFRA, spouseBFRA, spouseAsurvivorFRA, spouseBsurvivorFRA, spouseAgender, spouseBgender, spouseAgovernmentPension, spouseBgovernmentPension, discountRate) {
        var deemedFilingCutoff = new Date(1954, 0, 1);
        //find initial test dates for spouseA (first month for which spouseA is considered 62 for entire month)
        var spouseAretirementDate = new Date(spouseASSbirthDate.getFullYear() + 62, 1, 1);
        var spouseAspousalDate = new Date(spouseASSbirthDate.getFullYear() + 62, 1, 1);
        if (spouseAactualBirthDate.getDate() <= 2) {
            spouseAretirementDate.setMonth(spouseAactualBirthDate.getMonth());
            spouseAspousalDate.setMonth(spouseAactualBirthDate.getMonth());
        }
        else {
            spouseAretirementDate.setMonth(spouseAactualBirthDate.getMonth() + 1);
            spouseAspousalDate.setMonth(spouseAactualBirthDate.getMonth() + 1);
        }
        //If spouseA is currently over age 62 when filling out form, adjust their initial test dates to today's month/year instead of their age 62 month/year.
        var today = new Date();
        var spouseAageToday = today.getFullYear() - spouseASSbirthDate.getFullYear() + (today.getMonth() - spouseASSbirthDate.getMonth()) / 12;
        if (spouseAageToday > 62) {
            spouseAretirementDate.setMonth(today.getMonth());
            spouseAretirementDate.setFullYear(today.getFullYear());
            spouseAspousalDate.setMonth(today.getMonth());
            spouseAspousalDate.setFullYear(today.getFullYear());
        }
        //Do all of the same, but for spouseB.
        var spouseBretirementDate = new Date(spouseBSSbirthDate.getFullYear() + 62, 1, 1);
        var spouseBspousalDate = new Date(spouseBSSbirthDate.getFullYear() + 62, 1, 1);
        if (spouseBactualBirthDate.getDate() <= 2) {
            spouseBretirementDate.setMonth(spouseBactualBirthDate.getMonth());
            spouseBspousalDate.setMonth(spouseBactualBirthDate.getMonth());
        }
        else {
            spouseBretirementDate.setMonth(spouseBactualBirthDate.getMonth() + 1);
            spouseBspousalDate.setMonth(spouseBactualBirthDate.getMonth() + 1);
        }
        var spouseBageToday = today.getFullYear() - spouseBSSbirthDate.getFullYear() + (today.getMonth() - spouseBSSbirthDate.getMonth()) / 12;
        if (spouseBageToday > 62) {
            spouseBretirementDate.setMonth(today.getMonth());
            spouseBretirementDate.setFullYear(today.getFullYear());
            spouseBspousalDate.setMonth(today.getMonth());
            spouseBspousalDate.setFullYear(today.getFullYear());
        }
        //Check to see if spouseA's current spousalDate is prior to spouseB's earliest retirementDate. If so, adjust.
        if (spouseAspousalDate < spouseBretirementDate) {
            spouseAspousalDate.setFullYear(spouseBretirementDate.getFullYear());
            spouseAspousalDate.setMonth(spouseBretirementDate.getMonth());
        }
        //Initialize savedPV as zero. Set spouseAsavedDate and spouseBsavedDate equal to their current testDates.
        var savedPV = 0;
        var spouseAsavedRetirementDate = new Date(spouseAretirementDate);
        var spouseBsavedRetirementDate = new Date(spouseBretirementDate);
        var spouseAsavedSpousalDate = new Date(spouseAspousalDate);
        var spouseBsavedSpousalDate = new Date(spouseBspousalDate);
        //Set endingTestDate for each spouse equal to the month they turn 70
        var spouseAendTestDate = new Date(spouseASSbirthDate.getFullYear() + 70, spouseASSbirthDate.getMonth(), 1);
        var spouseBendTestDate = new Date(spouseBSSbirthDate.getFullYear() + 70, spouseBSSbirthDate.getMonth(), 1);
        while (spouseAretirementDate <= spouseAendTestDate) {
            //Reset spouseB test dates to earliest possible (i.e., their "age 62 for whole month" month or today's month if they're currently older than 62, but never earlier than spouse A's retirementDate)
            if (spouseBageToday > 62) {
                spouseBretirementDate.setMonth(today.getMonth());
                spouseBretirementDate.setFullYear(today.getFullYear());
                spouseBspousalDate.setMonth(today.getMonth());
                spouseBspousalDate.setFullYear(today.getFullYear());
            }
            else {
                spouseBretirementDate.setFullYear(spouseBSSbirthDate.getFullYear() + 62);
                spouseBspousalDate.setFullYear(spouseBSSbirthDate.getFullYear() + 62);
                if (spouseBactualBirthDate.getDate() <= 2) {
                    spouseBretirementDate.setMonth(spouseBactualBirthDate.getMonth());
                    spouseBspousalDate.setMonth(spouseBactualBirthDate.getMonth());
                }
                else {
                    spouseBretirementDate.setMonth(spouseBactualBirthDate.getMonth() + 1);
                    spouseBspousalDate.setMonth(spouseBactualBirthDate.getMonth() + 1);
                }
            }
            if (spouseBspousalDate < spouseAretirementDate) {
                spouseBspousalDate.setMonth(spouseAretirementDate.getMonth());
                spouseBspousalDate.setFullYear(spouseAretirementDate.getFullYear());
            }
            while (spouseBretirementDate <= spouseBendTestDate) {
                //Calculate PV using current testDates
                var currentTestPV = this.calculateCouplePV(spouseAgender, spouseBgender, spouseASSbirthDate, spouseBSSbirthDate, Number(spouseAinitialAgeRounded), Number(spouseBinitialAgeRounded), spouseAFRA, spouseBFRA, spouseAsurvivorFRA, spouseBsurvivorFRA, Number(spouseAPIA), Number(spouseBPIA), spouseAretirementDate, spouseBretirementDate, spouseAspousalDate, spouseBspousalDate, Number(spouseAgovernmentPension), Number(spouseBgovernmentPension), Number(discountRate));
                //If PV is greater than saved PV, save new PV and save new testDates
                if (currentTestPV > savedPV) {
                    savedPV = currentTestPV;
                    spouseAsavedRetirementDate.setMonth(spouseAretirementDate.getMonth());
                    spouseAsavedRetirementDate.setFullYear(spouseAretirementDate.getFullYear());
                    spouseBsavedRetirementDate.setMonth(spouseBretirementDate.getMonth());
                    spouseBsavedRetirementDate.setFullYear(spouseBretirementDate.getFullYear());
                    spouseAsavedSpousalDate.setMonth(spouseAspousalDate.getMonth());
                    spouseAsavedSpousalDate.setFullYear(spouseAspousalDate.getFullYear());
                    spouseBsavedSpousalDate.setMonth(spouseBspousalDate.getMonth());
                    spouseBsavedSpousalDate.setFullYear(spouseBspousalDate.getFullYear());
                }
                //Find next possible claiming combination for spouseB
                //if spouseB has new deemed filing rules, increment both dates by 1. (But don't increment spousalDate if it's currently set later than retirementDate.)
                //No need to check here if spousal is too early, because at start of this loop it was set to earliest possible.
                if (spouseBactualBirthDate > deemedFilingCutoff) {
                    if (spouseBspousalDate <= spouseBretirementDate) {
                        spouseBspousalDate.setMonth(spouseBspousalDate.getMonth() + 1);
                    }
                    spouseBretirementDate.setMonth(spouseBretirementDate.getMonth() + 1);
                }
                else {
                    //if spouseBretirementDate < FRA, increment both test dates by 1. (Don't increment spousalDate though if it is currently set later than retirementDate.)
                    if (spouseBretirementDate < spouseBFRA) {
                        if (spouseBspousalDate <= spouseBretirementDate) {
                            spouseBspousalDate.setMonth(spouseBspousalDate.getMonth() + 1);
                        }
                        spouseBretirementDate.setMonth(spouseBretirementDate.getMonth() + 1);
                        //No need to check here if spousal is too early, because at start of this loop it was set to earliest possible.
                    }
                    else {
                        //Increment retirement testdate by 1 and set spousal date to earliest possible restricted application date (later of FRA or other spouse's retirementtestdate)
                        spouseBretirementDate.setMonth(spouseBretirementDate.getMonth() + 1);
                        if (spouseAretirementDate > spouseBFRA) {
                            spouseBspousalDate.setMonth(spouseAretirementDate.getMonth());
                            spouseBspousalDate.setFullYear(spouseAretirementDate.getFullYear());
                        }
                        else {
                            spouseBspousalDate.setMonth(spouseBFRA.getMonth());
                            spouseBspousalDate.setFullYear(spouseBFRA.getFullYear());
                        }
                    }
                }
                //After spouse B's retirement testdate has been incremented, adjust spouseA's spousal date as necessary
                //If spouseA has new deemed filing rules, set spouseA spousalDate to later of spouseA retirementDate or spouseB retirementDate
                if (spouseAactualBirthDate > deemedFilingCutoff) {
                    if (spouseAretirementDate > spouseBretirementDate) {
                        spouseAspousalDate.setMonth(spouseAretirementDate.getMonth());
                        spouseAspousalDate.setFullYear(spouseAretirementDate.getFullYear());
                    }
                    else {
                        spouseAspousalDate.setMonth(spouseBretirementDate.getMonth());
                        spouseAspousalDate.setFullYear(spouseBretirementDate.getFullYear());
                    }
                }
                else {
                    if (spouseAretirementDate < spouseAFRA) {
                        //Set spouseA spousal testdate to later of spouseA retirementDate or spouseB retirementDate
                        if (spouseAretirementDate > spouseBretirementDate) {
                            spouseAspousalDate.setMonth(spouseAretirementDate.getMonth());
                            spouseAspousalDate.setFullYear(spouseAretirementDate.getFullYear());
                        }
                        else {
                            spouseAspousalDate.setMonth(spouseBretirementDate.getMonth());
                            spouseAspousalDate.setFullYear(spouseBretirementDate.getFullYear());
                        }
                    }
                    else {
                        //Set spouseA spousalDate to earliest possible restricted application date (later of FRA or spouse B's retirementDate)
                        if (spouseAFRA > spouseBretirementDate) {
                            spouseAspousalDate.setMonth(spouseAFRA.getMonth());
                            spouseAspousalDate.setFullYear(spouseAFRA.getFullYear());
                        }
                        else {
                            spouseAspousalDate.setMonth(spouseBretirementDate.getMonth());
                            spouseAspousalDate.setFullYear(spouseBretirementDate.getFullYear());
                        }
                    }
                }
            }
            //Add 1 month to spouseAretirementDate
            spouseAretirementDate.setMonth(spouseAretirementDate.getMonth() + 1);
        }
        //after loop is finished
        console.log("saved PV: " + savedPV);
        console.log("spouseAretirementDate: " + spouseAsavedRetirementDate);
        console.log("spouseBretirementDate: " + spouseBsavedRetirementDate);
        console.log("spouseAspousalDate: " + spouseAsavedSpousalDate);
        console.log("spouseBspousalDate: " + spouseBsavedSpousalDate);
        var solutionSet = {
            "solutionPV": savedPV,
            "spouseAretirementSolution": spouseAsavedRetirementDate,
            "spouseBretirementSolution": spouseBsavedRetirementDate,
            "spouseAspousalSolution": spouseAsavedSpousalDate,
            "spouseBspousalSolution": spouseBsavedSpousalDate
        };
        //Set spousal dates back to null in cases in which there will be no spousal benefit, so user doesn't see a suggested spousal claiming age that makes no sense.
        //need to recalculate spousal benefit for each spouse using the four saved dates.
        var finalCheckSpouseAretirement = this.benefitService.calculateRetirementBenefit(spouseAPIA, spouseAFRA, spouseAsavedRetirementDate);
        var finalCheckSpouseAspousal = this.benefitService.calculateSpousalBenefit(spouseAPIA, spouseBPIA, spouseAFRA, finalCheckSpouseAretirement, spouseAsavedSpousalDate, spouseAgovernmentPension);
        var finalCheckSpouseBretirement = this.benefitService.calculateRetirementBenefit(spouseBPIA, spouseBFRA, spouseBsavedRetirementDate);
        var finalCheckSpouseBspousal = this.benefitService.calculateSpousalBenefit(spouseBPIA, spouseAPIA, spouseBFRA, finalCheckSpouseBretirement, spouseBsavedSpousalDate, spouseBgovernmentPension);
        if (finalCheckSpouseAspousal == 0 && spouseAsavedSpousalDate >= spouseAsavedRetirementDate) {
            solutionSet.spouseAspousalSolution = null;
        }
        if (finalCheckSpouseBspousal == 0 && spouseBsavedSpousalDate >= spouseBsavedRetirementDate) {
            solutionSet.spouseBspousalSolution = null;
        }
        //Set retirement date to null if person has 0 PIA.
        if (spouseAPIA == 0) {
            solutionSet.spouseAretirementSolution = null;
        }
        if (spouseBPIA == 0) {
            solutionSet.spouseBretirementSolution = null;
        }
        return solutionSet;
    };
    PresentvalueService = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["A" /* Injectable */])(),
        __metadata("design:paramtypes", [__WEBPACK_IMPORTED_MODULE_2__benefit_service__["a" /* BenefitService */], __WEBPACK_IMPORTED_MODULE_1__birthday_service__["a" /* BirthdayService */]])
    ], PresentvalueService);
    return PresentvalueService;
}());



/***/ }),

/***/ "./src/environments/environment.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return environment; });
// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.
var environment = {
    production: false
};


/***/ }),

/***/ "./src/main.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("./node_modules/@angular/core/esm5/core.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__angular_platform_browser_dynamic__ = __webpack_require__("./node_modules/@angular/platform-browser-dynamic/esm5/platform-browser-dynamic.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__app_app_module__ = __webpack_require__("./src/app/app.module.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__environments_environment__ = __webpack_require__("./src/environments/environment.ts");




if (__WEBPACK_IMPORTED_MODULE_3__environments_environment__["a" /* environment */].production) {
    Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["_16" /* enableProdMode */])();
}
Object(__WEBPACK_IMPORTED_MODULE_1__angular_platform_browser_dynamic__["a" /* platformBrowserDynamic */])().bootstrapModule(__WEBPACK_IMPORTED_MODULE_2__app_app_module__["a" /* AppModule */])
    .catch(function (err) { return console.log(err); });


/***/ }),

/***/ 0:
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__("./src/main.ts");


/***/ })

},[0]);
//# sourceMappingURL=main.bundle.js.map