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
//this will set the number of required units based on rate. 
const unitsRequired = (uOFM, rate, areaS, unitS) => {
  return uOFM.includes('Acre') ? Math.ceil((((rate/43.56)*(areaS/1000)))/unitS) : Math.ceil(((rate*(areaS/1000))/unitS))
}
 //this function takes in the selected area's prefered unit of measure and the application products type and then will determine what the 
//initial unit of measure for the product is. This initial value can be overwritten by the user if desired. It is invoked above upon product selection
const pref = (areaUm, type)=>{ 
    
    return areaUm ==='M' && type==='Dry' ?  'LB/M':
    areaUm ==='M' && type==='Liquid' ?  'OZ/M':
    areaUm ==='Acre' && type==='Dry' ?  'LB/Acre':
    areaUm ==='Acre' && type==='Liquid' ?  'OZ/Acre':
    areaUm === '100 Gal' && type ==='Liquid' ? 'OZ/100 Gal':
    areaUm === '100 Gal' && type ==='Dry' ? 'LB/100 Gal':
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
//sum all the fert
const sumFert = (products)=>{
  const totals = products.reduce((basket, items) => {
    //console.log(basket) //is the const first loop blank
    //console.log(items) //is the object of data you want to reduce
      for (const [keyName, valueCount] of Object.entries(items)) {
        //only get the fields we want to add ship weight add this below     
          if(keyName  ==='N__c' || keyName==='P__c' || keyName ==='K__c'){
//if the basket does not contain the key add the key and set the value to 0
            if(!basket[keyName]) {
                basket[keyName] = 0;
            }
          basket[keyName] += Number(valueCount);
          }
        }
        return basket;
  }, {});
return totals; 
}

const roundRate = (numb, places) =>{
    return +(Math.round(numb + `e+${places}`) + `e-${places}`)
}

const onLoadTotalPrice = (data)=>{
  let total= data.reduce((x, y)=>{
                return x + y.Total_Price_ap__c;
          }, 0);
      return total; 
}

      //returns a round number for later math functions
const roundNum = (value, dec)=>{
  let x = Number(Math.round(parseFloat(value+'e'+dec))+'e-'+dec); 
      return x;
}


//cost per single product. Returns per M and per Acre
const areaCostCal = (perUnit, rate, unitOfMeasure)=>{
  let d = roundNum(perUnit * rate, 2);
  let perThousand = unitOfMeasure.includes('Acre') ? roundNum(d/43.56, 2): d;
  let perAcre = unitOfMeasure.includes('Acre') ? d : roundNum(d*43.56, 2);

  return {perThousand, perAcre}
}
//price per unit
const pricePerUnit = (prodPrice, uSize, prodRate,unitMeasure )=>{
  let areaSize = unitMeasure.includes('Acre') ? uSize/43.56 : uSize; 
  let price = roundNum(prodPrice/areaSize, 2);
  let final = areaCostCal(price, prodRate, unitMeasure);
  return final;
}


const perProduct = (prodPrice, prodSize, rate, unitOfMeasure)=>{
  let perOz = roundNum(prodPrice/prodSize, 2)
  let cost = roundNum(rate * perOz, 2)
  
  let perAcre = unitOfMeasure.includes('/M') ? cost : roundNum(cost*43.56, 2);
  let perThousand = unitOfMeasure.includes('Acre') ? cost: roundNum(cost/43.56, 2);
  return {perAcre, perThousand}; 
}



//acres treated
const areaTreated = (unitSize, rate, unitMeasure) =>{
  let treated = unitMeasure.includes('/M') ? roundNum((unitSize/rate)/43.56,2) : roundNum((unitSize/rate), 2);
  return treated; 
}
//on update merge pricing together with app products
const merge = (info, levels)=>{
  console.log(levels);
  
  let merged;
  if(info){
    console.log('info ' +info);
    merged = info.map(res =>({
      ...levels.find((i)=> (i.Product2Id === res.Product__c)),
      ...res
    })
  )
    return merged; 
  }else{
    return info; 
  }
}
//Ornamental helpers below. Please name orn"Whatever the function does""

const ornAppTotal = (prod) =>{
 
  let total = prod.reduce((a, b)=>{
      return Number(a +b.Total_Price__c)
  }, 0)
  
  total = roundRate(total, 2)
  return total; 
}

const ornPerProduct = (prodPrice, prodSize, rate)=>{
  let perGal = roundNum(prodPrice/prodSize, 2)
  let per100 = roundNum(perGal*rate, 2);

  return {per100, perGal}; 
}

const finishedGals = (size, rate) => roundNum(((size/rate) * 100), 2)
export{hold, 
      appTotal, 
      alreadyAdded, 
      pref, 
      calcDryFert, 
      calcLiqFert, 
      sumFert,
      unitsRequired, 
      roundRate, 
      onLoadTotalPrice, 
      roundNum, 
      pricePerUnit,
      perProduct,
      ornPerProduct, 
      merge,
      areaTreated,
      ornAppTotal, 
      finishedGals}

 
