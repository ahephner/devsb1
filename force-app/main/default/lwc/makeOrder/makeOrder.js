import { LightningElement, api, track } from 'lwc';
import insertOpp from '@salesforce/apex/programToOpportunity.createOpp';
import insertProd from '@salesforce/apex/programToOpportunity.createOppProduct';
//import readProds from '@salesforce/apex/programToOpportunity.jsMerge';
const columns = [
    { label: 'Name', fieldName: 'Name' },
    { label: 'Area', fieldName: 'Area_Name__c', sortable: "true" },
    { label: 'Date', fieldName: 'Date__c', sortable: "true"},
    {label: 'Total Price', 
    fieldName:'Total_Price_ap__c', 
    type:'currency',
    sortable:'true',
    cellAttributes: { alignment: 'center' }}
]
export default class MakeOrder extends LightningElement {
    @api recordId
    @track data; 
    @api apps;
    @track selection;
    loaded = true; 
    columns = columns; 
    totalprice = 0.00
    link;
    softLoad;
    msg; 
    sliderValue;
    connectedCallback(){
        this.data = [...this.apps]
        console.log(this.data)
    }
    
    getSelectedApp(e){
        this.selection = e.detail.selectedRows
        this.totalprice = this.selection.reduce((x,y)=>{
            return x + y.Total_Price_ap__c; 
        },0)

    }
    
    getDetails(){
        this.loaded = false
        let toOrder = []; 
        for(let i = 0; i<this.selection.length; i++){
            toOrder.push(this.selection[i].Id);
        }
        
        return toOrder; 
    }
    async convert(){
        this.loaded = false; 
        this.msg = 'Gathering Info'
        this.sliderValue = 25;
        let orders = this.getDetails();
        this.sliderValue = 50;
        this.msg = 'Saving Header Info'
        let opp = await insertOpp({progId: this.recordId})
        this.sliderValue = 75;
        this.msg = 'Saving Product Info';
        let saveProd = await insertProd({oppId: opp, appIds:orders})
        console.log('back',saveProd)
        this.sliderValue = 100; 
        //let prodsOnly = await readProds({oppId: opp, appIds:orders});
        console.log(prodsOnly)
        //sandbox
        //this.link = `https://advancedturf--full.lightning.force.com/lightning/r/Opportunity/${opp}/view`;
        //full
        this.link = `https://advancedturf.lightning.force.com/lightning/r/Opportunity/${opp}/view`
        this.softLoad = true    
        }
    // @api
    // get apps(){
    //     return this.data; 
    // }
    // set apps(value){
    //     this.data = value; 
    // }
    closeMe(){
        this.dispatchEvent(new CustomEvent('close')); 
    }
     //handle table sorting sorting
 //Grabbed this from a salesforce example
 handleSortdata(event) {
    // field name
    this.sortBy = event.detail.fieldName;

    // sort direction
    this.sortDirection = event.detail.sortDirection;

    // calling sortdata function to sort the data based on direction and selected field
    this.sortData(event.detail.fieldName, event.detail.sortDirection);
}

sortData(fieldname, direction) {
    // serialize the data before calling sort function
    let parseData = JSON.parse(JSON.stringify(this.data));

    // Return the value stored in the field
    let keyValue = (a) => {
        return a[fieldname];
    };

    // cheking reverse direction 
    let isReverse = direction === 'asc' ? 1: -1;

    // sorting data 
    parseData.sort((x, y) => {
        x = keyValue(x) ? keyValue(x) : ''; // handling null values
        y = keyValue(y) ? keyValue(y) : '';

        // sorting values based on direction
        return isReverse * ((x > y) - (y > x));
    });

    // set the sorted data to data table data
    this.data = parseData;

}
}