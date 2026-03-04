import { LightningElement } from 'lwc';
import {evalWeed} from 'c/programBuilderHelper'; 
export const GDD_RULES = [

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

export default class WeatherSummary2 extends LightningElement{

  loaded = false;

cur32;
cur50;
future32;
future50;

weedWarnings = [];

get hasWarnings() {
  return (this.weedWarnings?.length ?? 0) > 0;
}

get cur32Display() { return this.formatNum(this.cur32); }
get cur50Display() { return this.formatNum(this.cur50); }
get future32Display() { return this.formatNum(this.future32); }
get future50Display() { return this.formatNum(this.future50); }

formatNum(x) {
  if (x == null || Number.isNaN(x)) return '';
  return Math.round(x);
}

  // Outputs you can bind to UI
  monthlyResult = [];
  gddSummary = null;

  connectedCallback() {
    this.loadInfo(); 
    this.fetchHistory();
  }

  async loadInfo(){

  }
  fetchHistory = async () => {
    this.loaded = false;

    const apiEndpoint =
      'https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/';
    const location = '46060';

    // Choose the season/year you care about//get ath
    const endDate = '2025-02-27';
    const seasonStart = `${endDate.slice(0, 4)}-01-01`; // season-to-date from Jan 1
    const endPlus30 = addDays(endDate, 30);

    const apiKey = 'SC9NP46DF9TQT57GAHLWSDALA';
    const unitGroup = 'us';

    // Pull what we need once, then compute everything locally
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

      // --- 1) Build lookup by date for easy slicing ---
      const days = (weatherData.days ?? []).slice().sort((a, b) =>
        a.datetime.localeCompare(b.datetime)
      );
      const byDate = new Map(days.map((d) => [d.datetime, d]));

      // --- 2) Compute daily + cumulative GDD32/GDD50 across the whole pulled range ---
      let cum32 = 0;
      let cum50 = 0;

      // Optional cap for GDD50 (common): cap max at 86F. You can turn this off.
      const CAP_HIGH_FOR_50 = 86;

      const gddSeries = []; // [{date, gdd32, gdd50, cum32, cum50}]
      for (const d of days) {
        const tmax = d.tempmax;
        const tmin = d.tempmin;

        // If data gaps, skip safely
        const gdd32 = (tmax != null && tmin != null) ? calcGdd(tmax, tmin, 32) : 0;
        const gdd50 = (tmax != null && tmin != null) ? calcGdd(tmax, tmin, 50, CAP_HIGH_FOR_50) : 0;

        cum32 += gdd32;
        cum50 += gdd50;

        gddSeries.push({
          date: d.datetime,
          gdd32,
          gdd50,
          cum32,
          cum50
        });
      }

      // Helper to get cumulative value on a date (or nearest previous)
      const cumOnOrBefore = (targetDate) => {
        // Because gddSeries is sorted, walk from end (fast enough for ~400 days)
        for (let i = gddSeries.length - 1; i >= 0; i--) {
          if (gddSeries[i].date <= targetDate) return gddSeries[i];
        }
        return null;
      };

      const endPoint = cumOnOrBefore(endDate);
      const plus30Point = cumOnOrBefore(endPlus30);

      this.gddSummary = {
        seasonStart,
        endDate,
        endPlus30,
        // Season-to-date cumulative values (from seasonStart through endDate)
        stdCumGdd32: endPoint?.cum32 ?? null,
        stdCumGdd50: endPoint?.cum50 ?? null,
        // Projected cumulative values through endDate+30
        projCumGdd32_EndPlus30: plus30Point?.cum32 ?? null,
        projCumGdd50_EndPlus30: plus30Point?.cum50 ?? null,
        // Increment over the next 30 days (projection delta)
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
}

/**
 * Growing Degree Days:
 * - tavg = (tmax + tmin) / 2
 * - GDD = max(0, tavg - base)
 * Optionally cap high temperature (common in some models, e.g. 86F for base50).
 */
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
  console.log(`${y2}-${m2}-${d2}`)
  return `${y2}-${m2}-${d2}`;
}