import { LightningElement, wire } from 'lwc';
import { APPLICATION_SCOPE,MessageContext, publish, subscribe, unsubscribe} from 'lightning/messageService';
import Program_Builder from '@salesforce/messageChannel/Program_Builder__c';
/* https://developer.salesforce.com/docs/component-library/documentation/en/lwc/lwc.reference_salesforce_modules */
export default class ProductTable extends LightningElement {
    exposed = false;
    dateName = false;
    productList = false; 
    subscritption = null; 
    searchKey = ''; 
    pf ='All';
    cat = "All"; 
    areaSelected; 
    count = 0; 
    //App Info
    appName;
    appDate;
    interval;
    numbApps;
    daysApart;
    customInsert = false; 


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
        handleMessage(message){
            //console.log('handling ' +message.connector);
            this.exposed = message.connector;
            this.areaSelected = message.message; 
            this.dateName = true;
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
    save(){
        this.count += 1; 
        console.log('count ' + this.count);
        
    }
}
