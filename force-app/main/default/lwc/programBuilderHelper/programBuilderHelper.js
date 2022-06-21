const hold = () => console.log('hey');

const appTotal = (prod) =>{
    let total = prod.reduce((a, b)=>{
        return Number(a + (b.Unit_Price__c * b.Units_Required__c))
    }, 0)
    total = roundRate(total, 2)
    return total; 
}

const alreadyAdded = (newId, list) =>{
    let index = list.findIndex(x => x.Product__c === newId);
    let found = index < 0 ? false : true;
    return found;
}

 //this function takes in the selected area's prefered unit of measure and the application products type and then will determine what the 
//initial unit of measure for the product is. This initial value can be overwritten by the user if desired. It is invoked above upon product selection
const pref = (areaUm, type)=>{ 
    
    return areaUm ==='M' && type==='Dry' ?  'LB/M':
    areaUm ==='M' && type==='Liquid' ?  'OZ/M':
    areaUm ==='Acre' && type==='Dry' ?  'LB/Acre':
    areaUm ==='Acre' && type==='Liquid' ?  'OZ/Acre':
     ''
}

//const calcDryFert = (numRate,rateType, nit, phos, pot) =>{
const calcDryFert = (numRate,item) =>{   
  let x = item;     
  let n = x.nVal > 0 ? x.nVal/100 : 0;
  let p = x.pVal > 0 ? x.pVal/100 : 0; 
  let k = x.kVal > 0 ? x.kVal/100 : 0; 
  n = handleRate(n, numRate, x.Unit_Area__c);
  p = handleRate(p, numRate, x.Unit_Area__c);
  k = handleRate(k, numRate, x.Unit_Area__c);
  return {n,p,k}; 
}

const handleRate = (percent, rate, rateType) =>{
    let value = rateType.includes('Acre') ? (rate / 43.56)* percent : rate * percent;
    value = roundRate(value, 4)
    return value;
} 



const calcLiqFert = (numRate,item) =>{
  let x = item
  let n = x.nVal > 0 ? x.nVal/100 : 0;
  let p = x.pVal > 0 ? x.pVal/100 : 0;
  let k = x.kVal > 0 ? x.kVal/100 : 0;

  n = handleLRate(n, x.galLb, numRate);
  p = handleLRate(p, x.galLb, numRate);
  k = handleLRate(k, x.galLb, numRate);

  return {n,p,k}
}

const handleLRate = (chem, galWeight, rate) => {
    //18-3-6 1 gal weight 10.58LB want .33N/1000
    //10.58*.18= 1.9 N/1 gal
    //.33/1.9 = .17 128 * .17 = 21.76 oz to deliver .33
    let perGal = Math.abs(chem * galWeight)
    let perOz = Math.abs(perGal/128);
    let amount = Math.abs(perOz * rate);
    amount = roundRate(amount, 4);
    return amount;
  }
const roundRate = (numb, places) =>{
    return +(Math.round(numb + `e+${places}`) + `e-${places}`)
}


export{hold, appTotal, alreadyAdded, pref, calcDryFert, calcLiqFert}

 
// let n = calcDFert(prod.Rate2__c, prod.Unit_Area__c, areaSize, prod.nVal, prod.pVal, prod.kVal)

// //console.log(Array.isArray(n))
// //console.log(n[0])

// //liquid
// let liquid = {"Id":"01u2M00000ZBLpJQAX","Name":"FOLIAR-PAK BIO 12-6-6","Product__c":"01t2M0000062XyvQAE","unitPrice":117.28,"floorPrice":69.42,"unitCost":33.32,"margin":71.59,"agency":false,"nVal":11,"pVal":0,"kVal":11,"size":320,"isFert":true,"galWeight":10.58,"Product_Name__c":"FOLIAR-PAK BIO 12-6-6","Rate2__c":6,"Application__c":"","Note__c":"","Units_Required__c":1,"Unit_Area__c":"LB/Acre","Unit_Price__c":117.28,"Cost":33.32,"Margin__c":71.59,"Total_Price__c":117.28,"allowEdit":false,"Area__c":"","galLb":10.4}





// const test = calcLFert(liquid.Rate2__c, liquid.Unit_Area__c, areaSize, liquid.nVal, liquid.pVal, liquid.kVal, liquid.galLb)

// console.log(test[0])