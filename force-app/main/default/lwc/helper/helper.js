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