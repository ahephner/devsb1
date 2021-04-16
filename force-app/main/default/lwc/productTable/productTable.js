import { LightningElement, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { APPLICATION_SCOPE,MessageContext, publish, subscribe, unsubscribe} from 'lightning/messageService';
import Program_Builder from '@salesforce/messageChannel/Program_Builder__c';
import areaInfo from '@salesforce/apex/appProduct.areaInfo';
import addApplication from '@salesforce/apex/addApp.addApplication';
import addProducts from '@salesforce/apex/addApp.addProducts';
import multiInsert from '@salesforce/apex/addApp.multiInsert';
/* https://developer.salesforce.com/docs/component-library/documentation/en/lwc/lwc.reference_salesforce_modules */
export default class ProductTable extends LightningElement {
    //controls what component is up
    exposed = false;
    dateName = false;
    productList = false; 
    productRates = false;
    subscritption = null; 
    //firstApp = true; 
    //searching product table 
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
            //control flow for when trying to call refresh apex
            //if an issue look at the reset below I changed to undefined used to be ''
            if(this.areaId){
               this.handleArea(this.areaId)
               //console.log('areaId '+this.areaId);
               
            }
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
                    //console.log('areaCall '+this.areaSQft);
                })
            }
//how to call a function from a child comp. if tracking values in parent 
    // search(){
    //      //this.template.querySelector('c-app-product-list').searchProd(this.searchKey, this.pf, this.cat);
    //      this.template.querySelector('c-app-select-prod').searchProd(this.searchKey, this.pf, this.cat);   
    // }

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

    //set Name Date get values from appNameDate
    setNameDate(mess){
        this.appName = mess.detail.name;
        this.appDate = mess.detail.date;
        this.numbApps = mess.detail.numb;
        this.interval = mess.detail.spread;
        this.dateName = false;
        this.productList = true; 
        //console.log('spread '+ this.interval);
        
    }

    //this function takes in the selected area's prefered unit of measure and the application products type and then will determine what the 
    //initial unit of measure for the product is. This initial value can be overwritten by the user if desired. It is invoked above upon product selection
    pref = (areaUm, type)=>{ 
        // eslint-disable-next-line no-return-assign
        //console.log('areaUM '+areaUm+ ' type '+type);
        
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
         
        this.selectedProducts = mess.detail.map(item=>{
            return {...item,
               Product__c: item.Id,  
               Rate2__c: 0,
               Application__c: '',
               Note__c: '' ,
               Units_Required__c: '0',
               Unit_Area__c: this.pref(this.areaUM, item.Product_Type__c),  
               Unit_Price__c: "0",
               Margin__c: "0", 
               Total_Price__c: "0",
               Area__c: ''
            }
        } );

    }
    save(prod){ 
        this.selectedProducts = prod.detail; 
        let params = {
            appName: this.appName,
            appArea: this.areaId,
            appDate: this.appDate
        }
        addApplication({wrapper:params})
            .then((resp)=>{
                this.appId = resp.Id;
                this.selectedProducts.forEach((x)=> x.Application__c = this.appId)
                let products = JSON.stringify(this.selectedProducts);
                console.log('products '+products);

                addProducts({products:products})
                    .then(()=>{
                        this.dispatchEvent(
                            new ShowToastEvent({
                                title: 'Success',
                                message: 'Application created '+ this.appName,
                                variant: 'success',
                            }),
                        );      
                    }).then(()=>{
                        //console.log('interval '+this.interval);
                        
                        if(this.interval !='once'){
                            multiInsert({appId:this.appId, occurance:this.numbApps, daysBetween: this.interval})
                        }
                    }).then(()=>{
                        const payload = {
                            updateTable: true
                        }
                        publish(this.messageContext, Program_Builder, payload);
                        //console.log('sending '+ payload.updateTable);
                        
                    }).then(()=>{
                        //this.firstApp = true; 
                        this.closeModal(); 
                        this.appName = '';
                        //this may be an issue was = ''; 
                        this.areaId = undefined;
                        this.appDate = '';
                        this.selectedProducts = [];
                    }).catch((error)=>{
                        console.log(JSON.stringify(error))
                        let message = 'Unknown error';
                        if (Array.isArray(error.body)) {
                            message = error.body.map(e => e.message).join(', ');
                        } else if (typeof error.body.message === 'string') {
                            message = error.body.message;
                        }
                        this.dispatchEvent(
                            new ShowToastEvent({
                                title: 'Error loading contact',
                                message,
                                variant: 'error',
                            }),
                        );
                        this.closeModal(); 
                    })
            })

         
    }
}
