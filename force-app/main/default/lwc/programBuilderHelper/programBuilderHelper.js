const hold = () => console.log('hey');

const appTotal = (prod) =>{
    let total = prod.reduce((a, b)=>{
        return Number(a + (b.Unit_Price__c * b.Units_Required__c))
    }, 0)

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
export{hold, appTotal, alreadyAdded, pref}

// let prod = {"Id":"01u2M00000bMnJPQA0","Name":"AND 16-0-8 HUMIC DG/ 50% MU/ 150 SGN","Product__c":"01t2M000006FIQLQA4","Product_Type__c":"Dry","unitPrice":39.5,"floorPrice":39.5,"unitCost":25.08,"margin":36.51,"agency":false,"nVal":16,"pVal":0,"kVal":8,"size":0,"isFert":true,"Product_Name__c":"AND 16-0-8 HUMIC DG/ 50% MU/ 150 SGN","Rate2__c":272.25,"Application__c":"","Note__c":"","Units_Required__c":1,"Unit_Area__c":"LB/Acre","Unit_Price__c":39.5,"Cost":25.08,"Margin__c":36.51,"Total_Price__c":39.5,"allowEdit":false,"Area__c":""}

// let areaSize = 1000; 

// const calcFert = (numRate,rateType, areaSize, nit, phos, pot) =>{
//   let n = nit > 0 ? nit/100 : 0;
//   let p = phos > 0 ? phos/100 : 0; 
//   let k = pot > 0 ? pot/100 : 0; 
//   n = handleRate(n, numRate, rateType);
//   p = handleRate(p, numRate, rateType);
//   k = handleRate(k, numRate, rateType);
//   return [n,p,k]; 
// }


// const handleRate = (percent, rate, rateType) =>{
//   return rateType.includes('Acre') ? (rate / 43.56)* percent : rate * percent;
// }  
// let n = calcFert(prod.Rate2__c, prod.Unit_Area__c, areaSize, prod.nVal, prod.pVal, prod.kVal)

// console.log(Array.isArray(n))
// console.log(n[0])