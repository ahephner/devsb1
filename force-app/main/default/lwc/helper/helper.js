const hold = () => console.log('hey');

const appTotal = (prod) =>{
    let total = prod.reduce((a, b)=>{
        return Number(a + (b.Unit_Price__c * b.Units_Required__c))
    }, 0)

    return total; 
}
export{hold, appTotal}