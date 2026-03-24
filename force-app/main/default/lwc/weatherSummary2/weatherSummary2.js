import { LightningElement, api } from 'lwc';
import { evalWeed } from 'c/programBuilderHelper';
import getAddress from '@salesforce/apex/appProduct.getAddressInfo';
import { updateRecord } from 'lightning/uiRecordApi';
import NEWADDRESS from 'c/updateLocation';
import getWeatherCords from '@salesforce/apex/appWeather.getWeatherInfo';
import FORM_FACTOR from '@salesforce/client/formFactor';
export  const GDD_RULES = [

  // =========================
  // BASE 32 RULES
  // =========================

  {
    key: 'crab_preemerge_32',
    label: 'Crabgrass Preemerge Timing',
    base: 32,
    category: 'preemerge',
    description: 'Preemergent timing window for crabgrass control based on cumulative GDD32.',
    priority: 2,
    rules: [
      { min: 171, max: 250, message: 'Crab Preemerge Timing: Early', className: 'secondPestEarly' },
      { min: 251, max: 500, message: 'Crab Preemerge Timing: Optimum', className: 'secondPestTarget' },
      { min: 501, max: 801, message: 'Crab Preemerge Timing: Late', className: 'secondPestLate' }
    ]
  },

  {
    key: 'poa_annua_proxy_32',
    label: 'Poa Annua Seedhead Suppression',
    base: 32,
    category: 'pgr',
    description: 'Proxy/PGR timing for Poa annua seedhead suppression based on GDD32.',
    priority: 1,
    rules: [
      { min: 121, max: 220, message: 'Proxy/PGR Timing: Close', className: 'firstPestEarly' },
      { min: 221, max: 501, message: 'Proxy/PGR Timing: Target', className: 'firstPestTarget' },
      { min: 502, max: 651, message: 'Proxy/PGR Timing: Late', className: 'firstPestLate' }
    ]
  },

  // =========================
  // BASE 50 RULES
  // =========================

  {
    key: 'spring_broadleaf_50',
    label: 'Spring Broadleaf Control',
    base: 50,
    category: 'broadleaf',
    description: 'Spring broadleaf herbicide timing based on cumulative GDD50.',
    priority: 1,
    rules: [
      { min: 71,  max: 110, message: 'Broadleaf Timing: Early', className: 'firstPestEarly' },
      { min: 110, max: 151, message: 'Broadleaf Timing: Ester', className: 'firstPestEarly' },
      { min: 152, max: 201, message: 'Broadleaf Timing: Ester or Amine', className: 'firstPestEarly' },
      { min: 202, max: 601, message: 'Broadleaf Timing: Amine', className: 'firstPestEarly' }
    ]
  },

  {
    key: 'crab_germination_50',
    label: 'Crabgrass Germination',
    base: 50,
    category: 'germination',
    description: 'Crabgrass germination pressure windows based on cumulative GDD50.',
    priority: 2,
    rules: [
      { min: 100, max: 200, message: 'Crabgrass Germination: Early', className: 'secondPestEarly' },
      { min: 201, max: 601, message: 'Crabgrass Germination: Prime', className: 'secondPestTarget' },
      { min: 601, max: 1401, message: 'Crabgrass Germination: Late', className: 'secondPestLate' }
    ]
  }

];

export default class WeatherSummary2 extends LightningElement {
  loaded = false;

  // ===== Existing "Previous Year" fields (unchanged) =====
  cur32;
  cur50;
  future32;
  future50;
  weedWarnings = [];
  @api recordId; 
  zip; 
  lat;
  long;
  accountId;
  prevStart;
  prevEnd; 
  get hasWarnings() {
    return (this.weedWarnings?.length ?? 0) > 0;
  }

  get cur32Display() { return this.formatNum(this.cur32); }
  get cur50Display() { return this.formatNum(this.cur50); }
  get future32Display() { return this.formatNum(this.future32); }
  get future50Display() { return this.formatNum(this.future50); }

  // ===== NEW: Current YTD fields =====
  ytd32;
  ytd50;
  ytdFuture32;
  ytdFuture50;
  weedWarningsYtd = [];
  isDesktop; 
  get hasWarningsYtd() {
    return (this.weedWarningsYtd?.length ?? 0) > 0;
  }

  get ytd32Display() { return this.formatNum(this.ytd32); }
  get ytd50Display() { return this.formatNum(this.ytd50); }
  get ytdFuture32Display() { return this.formatNum(this.ytdFuture32); }
  get ytdFuture50Display() { return this.formatNum(this.ytdFuture50); }

  formatNum(x) {
    if (x == null || Number.isNaN(x)) return '';
    return Math.round(x);
  }

  // Outputs you can bind to UI
  monthlyResult = [];
  gddSummary = null;

  connectedCallback() {
    this.start() // ✅ NEW
  }

  async start(){
    this.isDesktop = FORM_FACTOR === 'Large';
    let one = await this.loadInfo();
    let two = await this.fetchHistory();
    let three = await this.fetchCurrent();
  }

  async loadInfo(){
    let zips = await getWeatherCords({recordId: this.recordId})
      //future lat = zips[0].Preferred_Lat_Long__c.latitude
      //future long = zips[0].Preferred_Lat_Long__c.longitude
      this.zip = zips[0]?.Preferred_Zip_Code__c ?? ''
      this.lat = zips[0].Preferred_Lat_Long__c ? zips[0].Preferred_Lat_Long__c.latitude:  zips[0].Account__r.BillingLatitude;
      this.long = zips[0].Preferred_Lat_Long__c ? zips[0].Preferred_Lat_Long__c.longitude: zips[0].Account__r.BillingLongitude;
      this.accountId = zips[0].Account__c;
  }

  // ===== Existing fetchHistory (UNCHANGED except: local cumOnOrBefore removed) =====
  fetchHistory = async () => {
    this.loaded = false;

    const apiEndpoint =
      'https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/';
    const location = `${this.lat},${this.long}`;
//need to automate

    let today = new Date(); 
    let oneYearAgo = new Date(today);

    // 3. Subtract one year using setFullYear()
    oneYearAgo.setFullYear(today.getFullYear() - 1);
    oneYearAgo = oneYearAgo.toISOString().slice(0,10); 


    const endDate = '2025-02-27';
    const seasonStart = `${oneYearAgo.slice(0, 4)}-01-01`;
    const endPlus30 = addDays(oneYearAgo, 30);
    this.prevStart = seasonStart;
    this.prevEnd = endPlus30; 
    const apiKey = 'SC9NP46DF9TQT57GAHLWSDALA';
    const unitGroup = 'us';
    const elements = 'datetime,tempmax,tempmin,precip';

    const url =
      `${apiEndpoint}${encodeURIComponent(location)}/${seasonStart}/${endPlus30}` +
      `?key=${encodeURIComponent(apiKey)}` +
      `&unitGroup=${encodeURIComponent(unitGroup)}` +
      `&include=days` +
      `&elements=${encodeURIComponent(elements)}` +
      `&contentType=json`;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const weatherData = await response.json();

      const days = (weatherData.days ?? []).slice().sort((a, b) =>
        a.datetime.localeCompare(b.datetime)
      );

      let cum32 = 0;
      let cum50 = 0;
      const CAP_HIGH_FOR_50 = 86;

      const gddSeries = [];
      for (const d of days) {
        const tmax = d.tempmax;
        const tmin = d.tempmin;

        const gdd32 = (tmax != null && tmin != null) ? calcGdd(tmax, tmin, 32) : 0;
        const gdd50 = (tmax != null && tmin != null) ? calcGdd(tmax, tmin, 50, CAP_HIGH_FOR_50) : 0;

        cum32 += gdd32;
        cum50 += gdd50;

        gddSeries.push({ date: d.datetime, gdd32, gdd50, cum32, cum50 });
      }

      // ✅ now uses global helper
      const endPoint = cumOnOrBefore(gddSeries, oneYearAgo);
      const plus30Point = cumOnOrBefore(gddSeries, endPlus30);

      this.gddSummary = {
        seasonStart,
        oneYearAgo,
        endPlus30,
        stdCumGdd32: endPoint?.cum32 ?? null,
        stdCumGdd50: endPoint?.cum50 ?? null,
        projCumGdd32_EndPlus30: plus30Point?.cum32 ?? null,
        projCumGdd50_EndPlus30: plus30Point?.cum50 ?? null,
        next30Gdd32: (endPoint && plus30Point) ? (plus30Point.cum32 - endPoint.cum32) : null,
        next30Gdd50: (endPoint && plus30Point) ? (plus30Point.cum50 - endPoint.cum50) : null
      };

      this.cur32 = this.gddSummary.stdCumGdd32;
      this.cur50 = this.gddSummary.stdCumGdd50;
      this.future32 = this.gddSummary.projCumGdd32_EndPlus30;
      this.future50 = this.gddSummary.projCumGdd50_EndPlus30;

      this.weedWarnings = await evalWeed(
        this.cur32,
        this.cur50,
        this.future32,
        this.future50,
        GDD_RULES
      );

      this.loaded = true;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching weather data:', error);
      this.loaded = true;
    }
  };

  // ===== NEW: fetchCurrent() for current-year YTD + today+30 =====
  fetchCurrent = async () => {
    // NOTE: do NOT touch this.loaded here so your existing loading UX stays stable.
    // If you want, we can add a separate ytdLoaded flag later.

    const apiEndpoint =
      'https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/';
    const location = `${this.lat},${this.long}`;

    const today = todayUtcYmd();                   // e.g. '2026-03-04'
    const currentYear = today.slice(0, 4);         // '2026'
    const ytdStart = `${currentYear}-01-01`;
    const endPlus30 = addDays(today, 30);

    const apiKey = 'SC9NP46DF9TQT57GAHLWSDALA';
    const unitGroup = 'us';
    const elements = 'datetime,tempmax,tempmin,precip';

    const url =
      `${apiEndpoint}${encodeURIComponent(location)}/${ytdStart}/${endPlus30}` +
      `?key=${encodeURIComponent(apiKey)}` +
      `&unitGroup=${encodeURIComponent(unitGroup)}` +
      `&include=days` +
      `&elements=${encodeURIComponent(elements)}` +
      `&contentType=json`;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const weatherData = await response.json();

      const days = (weatherData.days ?? []).slice().sort((a, b) =>
        a.datetime.localeCompare(b.datetime)
      );

      let cum32 = 0;
      let cum50 = 0;
      const CAP_HIGH_FOR_50 = 86;

      const gddSeries = [];
      for (const d of days) {
        const tmax = d.tempmax;
        const tmin = d.tempmin;

        const gdd32 = (tmax != null && tmin != null) ? calcGdd(tmax, tmin, 32) : 0;
        const gdd50 = (tmax != null && tmin != null) ? calcGdd(tmax, tmin, 50, CAP_HIGH_FOR_50) : 0;

        cum32 += gdd32;
        cum50 += gdd50;

        gddSeries.push({ date: d.datetime, gdd32, gdd50, cum32, cum50 });
      }

      const nowPoint = cumOnOrBefore(gddSeries, today);
      const plus30Point = cumOnOrBefore(gddSeries, endPlus30);
      console.log(plus30Point)
      this.ytd32 = nowPoint?.cum32 ?? null;
      this.ytd50 = nowPoint?.cum50 ?? null;
      this.ytdFuture32 = plus30Point?.cum32 ?? null;
      this.ytdFuture50 = plus30Point?.cum50 ?? null;

      this.weedWarningsYtd = await evalWeed(
        this.ytd32,
        this.ytd50,
        this.ytdFuture32,
        this.ytdFuture50,
        GDD_RULES
      );
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching current YTD weather data:', error);
    }
  };

  //for updating
  async updateZipLatLong(){
        const fields = {};
        fields[REC_ID.fieldApiName] = this.recordId
        fields['Preferred_Lat_Long__Longitude__s'] = this.long
        fields['Preferred_Lat_Long__Latitude__s'] = this.lat
       
        const recordInput = {fields}
        updateRecord(recordInput)
        .then(() => {
          this.dispatchEvent(
            new ShowToastEvent({
              title: "Success",
              message: "Address updated",
              variant: "success",
            }),
          );
          this.start()
         
        }).catch((error)=>{
          let err =  JSON.stringify(error);
          this.dispatchEvent(
            new ShowToastEvent({
              title: "Error",
              message: err,
              variant: "error",
            }),
          );
        })
      }

  async getApexLocation(x){
        let raw = await getAddress({streetAddress: x})
        //console.log(raw)
        this.lat = raw.data.position.lat
        this.long = raw.data.position.lng;
        this.updateZipLatLong(); 
   }
  //Update location: 
 async updateLocation(){
      let newAdd = await NEWADDRESS.open({
        size:'small',
        initLatitude: this.lat,
        initLongitude: this.long,
        initZipCode: this.zip
      }).then((x)=>{
        if(x === undefined){
          return;
        }else if(x.updateHow === 'cords'){
          this.zip = x.zipCode;
          this.lat = x.lattitude;
          this.long = x.longitude; 
          this.updateZipLatLong();
        }else{
          this.getApexLocation(x.address)
        }

      }).catch((error)=>{
        let err =  JSON.stringify(error);
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Error",
            message: err,
            variant: "error",
          }),
        );
      })
    }
}


/* ===== Global helpers (so you can reuse) ===== */

function cumOnOrBefore(gddSeries, targetDate) {
  for (let i = gddSeries.length - 1; i >= 0; i--) {
    if (gddSeries[i].date <= targetDate) return gddSeries[i];
  }
  return null;
}

function todayUtcYmd() {
  const dt = new Date();
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const d = String(dt.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function calcGdd(tempmax, tempmin, base, capHigh = null) {
  let tMax = tempmax;
  let tMin = tempmin;
  if (capHigh != null && tMax > capHigh) tMax = capHigh;

  const tAvg = (tMax + tMin) / 2;
  return Math.max(0, tAvg - base);
}

function addDays(yyyyMmDd, daysToAdd) {
  const [y, m, d] = yyyyMmDd.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + daysToAdd);
  const y2 = dt.getUTCFullYear();
  const m2 = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const d2 = String(dt.getUTCDate()).padStart(2, '0');
  return `${y2}-${m2}-${d2}`;
}