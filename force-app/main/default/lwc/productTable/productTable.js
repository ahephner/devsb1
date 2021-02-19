import { LightningElement, wire } from 'lwc';
import { APPLICATION_SCOPE,MessageContext, publish, subscribe, unsubscribe} from 'lightning/messageService';
import Program_Builder from '@salesforce/messageChannel/Program_Builder__c';
import areaInfo from '@salesforce/apex/appProduct.areaInfo';
/* https://developer.salesforce.com/docs/component-library/documentation/en/lwc/lwc.reference_salesforce_modules */
export default class ProductTable extends LightningElement {
    //controls what component is up
    exposed = false;
    dateName = false;
    productList = false; 
    productRates = false;
    subscritption = null; 
    //searching product table
    searchKey = ''; 
    pf ='All';
    cat = "All"; 
    areaSelected;
    areaId;  
    count = 0; 
    //App Info
    appName;
    appDate;
    interval;
    numbApps;
    daysApart;
    customInsert = false; 
    selectedProducts = []; 

    @wire(MessageContext)
        messageContext; 
//subscribe to message channel
        subscribeToMessage(){
            if(!this.subscritption){
                this.subscritption = subscribe(
                    this.messageContext,
                    Program_Builder,
                    (message) => this.handleMessage(message),
                    {scope: APPLICATION_SCOPE}
                );
            }
        }
//handle the message
//then call get the area info for the product conversions 
        handleMessage(message){
            //console.log('handling ' +message.connector);
            this.exposed = message.connector;
            this.areaSelected = message.message; 
            this.dateName = true;
            this.areaId = message.areaId;
            this.handleArea(this.areaId)
            
        }
//life cycle hooks
        unsubscribeFromMessageChannel(){
                unsubscribe(this.subscritption);
                this.subscritption = null; 
        }

        connectedCallback(){
            this.subscribeToMessage();
        }
        disconnectedCallback(){
            this.unsubscribeFromMessageChannel(); 
        }

        //get area info for the product calculations
       handleArea(x){ 
        areaInfo({ai:x})
            .then((resp)=>{
                this.areaSQft = resp[0].Area_Sq_Feet__c
                this.areaUM = resp[0].Pref_U_of_M__c
                //console.log('areaCall '+x);
            })
        }

//get set new product family/category search
    get pfOptions(){
        return [
            {label: 'All', value:'All'}, 
            {label: 'Foliar-Pak', value:'Foliar-Pak'},
            {label: 'BASF', value:'BASF'}
        ]
    }
    get catOptions(){
        return [
            {label: 'All', value: 'All'}, 
            {label: 'Herbicide', value:'Chemicals-Herbicide'},
            {label: 'Fungicide', value:'Chemicals-Fungicide'},
            {label: 'Insecticide', value:'Chemicals-Insecticide'},
            {label: 'PGR', value:'Chemicals-Growth Regulator'}, 
        ]
    }

    search(){
         //this.template.querySelector('c-app-product-list').searchProd(this.searchKey, this.pf, this.cat);
         this.template.querySelector('c-app-select-prod').searchProd(this.searchKey, this.pf, this.cat);   
    }
    ///! Uncomment these if we want to change the values each time they change
    searchProd(event){
      this.searchKey = event.target.value;
    }
    pfChange(event){
        this.pf = event.detail.value; 
    }

    catChange(e){
        this.cat = e.detail.value; 
    }
//close modal
    closeModal(){
        this.exposed = false; 
        //for now I have to turn both off. May make sense to either A. clear all values in the components first
        this.dateName = false;
        this.productList = false; 
        this.productRates = false; 
    }
    nextProdList(){
        this.dateName = false;
        this.productList = true; 
    }

    //set Name Date
    setNameDate(mess){
        this.appName = mess.detail.name;
        this.appDate = mess.detail.date;
        this.numbApps = mess.detail.numb;
        this.interval = mess.detail.spread;
        this.dateName = false;
        this.productList = true; 
        //console.log('appName '+ this.appName);
        
    }
//custom insert will allow for on the insert to use apex function that clones
    setCustNameDate(mess){
        this.appName = mess.detail.name;
        this.appDate = mess.detail.date;
        this.numbApps = mess.detail.numb;
        this.interval = mess.detail.time;
        this.daysApart = mess.detail.time; 
        this.customInsert = true; 
        this.dateName = false;
        this.productList = true;
        // console.log('app name ' + this.appName + ' date '+this.appDate);
        // console.log('numbApps ' +this.numbApps + ' interval '+this.interval);
        // console.log('days apart ' +this.daysApart + 'customInsert '+this.customInsert);
  
    }
    //this function takes in the selected area's prefered unit of measure and the application products type and then will determine what the 
    //initial unit of measure for the product is. This initial value can be overwritten by the user if desired. It is invoked above upon product selection
    pref = (areaUm, type)=>{ 
        // eslint-disable-next-line no-return-assign
        console.log('areaUM '+areaUm+ ' type '+type);
        
        return areaUm ==='M' && type==='Dry' ?  'LB/M':
        areaUm ==='M' && type==='Liquid' ?  'OZ/M':
        areaUm ==='Acre' && type==='Dry' ?  'LB/Acre':
        areaUm ==='Acre' && type==='Liquid' ?  'OZ/Acre':
         ''
    }
    //gathers products from appSelectProd then maps over to set values for the appRatePrice that are need for the math functions
    //the pref uses the above function to set the unit of measure automatically for the user
    gatherProducts(mess){
        this.productList = false;
        this.productRates = true; 
        //this.selectedProducts = mess.detail;       
         //console.log('this areaUM '+ this.areaUM);
         
        this.selectedProducts = mess.detail.map(item=>{
            return {...item, 
               Rate2__c: 0,
               Application__c: '',
               Note__c: '' ,
               Units_Required__c: '',
               Unit_Area__c: this.pref(this.areaUM, item.Product_Type__c),  
               Unit_Price__c: "0",
               Margin__c: "0", 
               Total_Price__c: "0",
               Area__c: ''
            }
        } );

    }
    save(){
        this.count += 1; 
        console.log('count ' + this.count);
        
    }
}
