import { LightningElement, api, track, wire } from 'lwc';
import {appTotal, calcDryFert, calcLiqFert, unitsRequired, roundNum, perProduct,pricePerUnit, areaTreated, sumFert,lowVolume, lvUnits} from 'c/programBuilderHelper';
import {checkPricing} from 'c/helper';
import { getObjectInfo, getPicklistValues} from 'lightning/uiObjectInfoApi';
import PRODUCT_OBJ from '@salesforce/schema/App_Product__c';
import NOTE from '@salesforce/schema/App_Product__c.Note__c';
export default class AppRatePrice extends LightningElement {
           @track data; 
           @api areaSize;
           appTotalPrice;  
           loaded = true; 
           appTotalN = 0
           appTotalP = 0
           appTotalK = 0
           measure = 'M'
           goodPricing = true; 
           noteOps; 
           //for mouse over
           showProdInfo = false;
           productName = '';
           productCost = 0;
           levelOne;
           levelTwo;
           prodFloor;
           prodCostM;
           prodCostA;
           totalCostPerM = 0;
           totalCostPerAcre = 0;
           treatedAcreage = 0;
           prodN;
           prodP;
           prodK;
           //note on the application 
           oppNote = ''; 

           @api 
           get selection(){
            return this.data;
           }
           //need to make this private so we can edit this
           set selection(value){
               this.data = JSON.parse(JSON.stringify(value));     
               this.appTotalPrice = appTotal(this.data); 
           }

    //need this to get picklist
    @wire(getObjectInfo, { objectApiName: PRODUCT_OBJ })
        objectInfo;

    //get sub category picklist
    @wire(getPicklistValues, {
        recordTypeId: "$objectInfo.data.defaultRecordTypeId",
        fieldApiName: NOTE
      })
      noteOps;

//user changes the rate for the product
           newRate(e){
            let index = this.data.findIndex(prod => prod.Id === e.target.name);
            
            window.clearTimeout(this.delay);
             // eslint-disable-next-line @lwc/lwc/no-async-operation
            this.delay = setTimeout(()=>{
                this.data[index].Rate2__c = Number(e.detail.value);
                
                if(this.data[index].Unit_Area__c != '' && this.data[index].Unit_Area__c != null && this.data[index].Unit_Area__c != '100 Gal' ){
                    //console.log('uofm',this.data[index].Unit_Area__c,'rate', this.data[index].Rate2__c,'area size', this.areaSize,'product size', this.data[index].size)
                    this.data[index].Units_Required__c = unitsRequired(this.data[index].Unit_Area__c, this.data[index].Rate2__c, this.areaSize, this.data[index].Product_Size__c )    
                    this.data[index].Total_Price__c = roundNum(this.data[index].Units_Required__c * this.data[index].Unit_Price__c,2);
                    let costs = perProduct(this.data[index].Total_Price__c, this.data[index].Product_Size__c, this.data[index].Rate2__c, this.data[index].Unit_Area__c);
                    let prodCost = pricePerUnit(this.data[index].Unit_Price__c, this.data[index].Product_Size__c, this.data[index].Rate2__c,this.data[index].Unit_Area__c);
                    this.data[index].Cost_per_M__c = prodCost.perThousand;
                    this.data[index].Cost_per_Acre__c = prodCost.perAcre; 
                    this.prodCostM = prodCost.perThousand;
                    this.prodCostA = prodCost.perAcre;
                    this.prodAreaCost = this.areaAcres * this.costPerAcre; 
                    this.treatedAcreage = areaTreated(this.data[index].Product_Size__c,this.data[index].Rate2__c, this.data[index].Unit_Area__c );
                    this.data[index].Acres_Treated__c = this.treatedAcreage
                    this.appTotalPrice = appTotal(this.data);
                    this.totalCostPerM = roundNum(Object.values(this.data).reduce((t,{Cost_per_M__c})=>t+Cost_per_M__c,0),2)
                    if(this.data[index].isFert){
                        let fert = this.data[index].Product_Type__c === 'Dry' ? calcDryFert(this.data[index].Rate2__c, this.data[index]) : calcLiqFert(this.data[index].Rate2__c, this.data[index]);
                        this.data[index].N__c = fert.n;
                        this.data[index].P__c = fert.p;
                        this.data[index].K__c = fert.k;
                        
                        let totalFert = sumFert(this.data)
                        this.appTotalN = roundNum(totalFert.N__c, 4);
                        this.appTotalP = roundNum(totalFert.P__c, 4);
                        this.appTotalK = roundNum(totalFert.K__c, 4); 
                    } 
                }else if(this.data[index].Unit_Area__c ==='100 Gal'){
                    this.data[index].isLowVol__c = true; 
                    this.data[index].unitAreaStyles = 'slds-col slds-size_2-of-12 lowVolume'
    
                    let {Rate2__c, Product_Size__c, Unit_Price__c, Spray_Vol_M__c, Cost_per_Acre__c} = this.data[index];
                    if(Spray_Vol_M__c>0 && Rate2__c> 0){
                         let finished = lowVolume(Rate2__c, Product_Size__c, Spray_Vol_M__c, Unit_Price__c) 
                    
                        //updateValues
                        this.data[index].Units_Required__c = lvUnits(this.areaSize, Spray_Vol_M__c, Product_Size__c, Rate2__c);
                        this.data[index].Total_Price__c = roundNum(this.data[index].Units_Required__c * this.data[index].Unit_Price__c, 2);
                         
                         this.data[index].Cost_per_M__c = finished.singleThousand;
                         this.data[index].Cost_per_Acre__c = finished.singleAcre;
                         this.prodCostM = finished.singleThousand;;
                         this.prodCostA = finished.singleAcre;
                         //this.prodAreaCost = this.areaAcres * this.costPerAcre;
                         this.treatedAcreage = finished.acresTreated
                         this.data[index].Acres_Treated__c = finished.acresTreated
                         this.appTotalPrice = appTotal(this.data); 
                         this.totalCostPerM = roundNum(Object.values(this.data).reduce((t,{Cost_per_M__c})=>t+Cost_per_M__c,0),2)
                    }
    
                   }
                
            },500 ) 
           }

           handleUnitArea(e){
               let index = this.data.findIndex(prod => prod.Id === e.target.name);
               //console.log('index ' +index + ' detail '+e.detail.value );
               
               this.data[index].Unit_Area__c = e.detail.value;
               this.data[index].isLowVol__c = e.detail.value!= '100 Gal'? false: true;
               this.data[index].unitAreaStyles = e.detail.value!= '100 Gal' ?'slds-col slds-size_2-of-12': 'slds-col slds-size_2-of-12 lowVolume'
               if(this.data[index].Rate2__c > 0 && e.detail.value!= '100 Gal'){
                this.data[index].Units_Required__c = unitsRequired(this.data[index].Unit_Area__c, this.data[index].Rate2__c, this.areaSize, this.data[index].Product_Size__c );
                this.data[index].Total_Price__c = roundNum(this.data[index].Units_Required__c * this.data[index].Unit_Price__c, 2);

                let costs = perProduct(this.data[index].Total_Price__c, this.data[index].Product_Size__c, this.data[index].Rate2__c, this.data[index].Unit_Area__c);
                let prodCost = pricePerUnit(this.data[index].Unit_Price__c, this.data[index].Product_Size__c, this.data[index].Rate2__c,this.data[index].Unit_Area__c);
                this.data[index].Cost_per_M__c = prodCost.perThousand;
                this.data[index].Cost_per_Acre__c = prodCost.perAcre; 
               
                 
                this.prodCostM = prodCost.perThousand;
                this.prodCostA = prodCost.perAcre;
                this.prodAreaCost = this.areaAcres * this.costPerAcre;
                this.treatedAcreage = areaTreated(this.data[index].Product_Size__c,this.data[index].Rate2__c, this.data[index].Unit_Area__c );
                this.data[index].Acres_Treated__c = this.treatedAcreage
                this.appTotalPrice = appTotal(this.data); 
                this.totalCostPerM = roundNum(Object.values(this.data).reduce((t,{Cost_per_M__c})=>t+Cost_per_M__c,0),2)
                //handle fertilizer
                if(this.data[index].isFert){
                    let fert = this.data[index].Product_Type__c === 'Dry' ? calcDryFert(this.data[index].Rate2__c, this.data[index]) : calcLiqFert(this.data[index].Rate2__c, this.data[index]);
                    this.data[index].N__c = fert.n;
                    this.data[index].P__c = fert.p;
                    this.data[index].K__c = fert.k;
                    
                    let totalFert = sumFert(this.data)
                    this.appTotalN = roundNum(totalFert.N__c, 4);
                    this.appTotalP = roundNum(totalFert.P__c, 4);
                    this.appTotalK = roundNum(totalFert.K__c, 4); 
                } 
               }else if(e.detail.value==='100 Gal'){

                let {Rate2__c, Product_Size__c, Unit_Price__c, Spray_Vol_M__c, Cost_per_Acre__c} = this.data[index];
                if(Spray_Vol_M__c>0 && Rate2__c> 0){
                     let finished = lowVolume(Rate2__c, Product_Size__c, Spray_Vol_M__c, Unit_Price__c) 
                
                    //updateValues
                     this.data[index].Units_Required__c = lvUnits(this.areaSize, Spray_Vol_M__c, Product_Size__c, Rate2__c);
                     this.data[index].Total_Price__c = roundNum(this.data[index].Units_Required__c * this.data[index].Unit_Price__c, 2); 

                     this.data[index].Cost_per_M__c = finished.singleThousand;
                     this.data[index].Cost_per_Acre__c = finished.singleAcre;
                     this.data[index].Acres_Treated__c = finished.acresTreated
                     this.prodCostM = finished.singleThousand;;
                     this.prodCostA = finished.singleAcre;
                     //this.prodAreaCost = this.areaAcres * this.costPerAcre;
                     this.treatedAcreage = finished.acresTreated;
                    
                     this.appTotalPrice = appTotal(this.data); 
                     this.totalCostPerM = roundNum(Object.values(this.data).reduce((t,{Cost_per_M__c})=>t+Cost_per_M__c,0),2)
                }

               }
           }
           handleLowVol(e){
            let index = this.data.findIndex(prod => prod.Id === e.target.name);
            
            if(this.data[index].Rate2__c === undefined || this.data[index].Rate2__c<0){
                return;
            }else{
                window.clearTimeout(this.delay);
                
                this.delay = setTimeout(()=>{
                
                this.data[index].Spray_Vol_M__c = Number(e.detail.value); 
                 let {Rate2__c, Product_Size__c, Unit_Price__c, Cost_per_M__c, Cost_per_Acre__c} = this.data[index];
                 let finished = lowVolume(Rate2__c, Product_Size__c, Spray_Vol_M__c, Unit_Price__c) 
                 
                 //updateValues
                 this.data[index].Total_Price__c = roundNum(this.data[index].Units_Required__c * this.data[index].Unit_Price__c, 2);
                 this.data[index].Units_Required__c = lvUnits(this.areaSize, Spray_Vol_M__c, Product_Size__c, Rate2__c);
                 
                 
                 this.data[index].Cost_per_M__c = finished.singleThousand;
                 this.data[index].Cost_per_Acre__c = finished.singleAcre;
                 this.prodCostM = finished.singleThousand;;
                 this.prodCostA = finished.singleAcre;
                 //this.prodAreaCost = this.areaAcres * this.costPerAcre;
                 this.treatedAcreage = finished.acresTreated;
                 this.data[index].Acres_Treated__c = finished.acresTreated
                 this.appTotalPrice = appTotal(this.data); 
                 this.totalCostPerM = roundNum(Object.values(this.data).reduce((t,{Cost_per_M__c})=>t+Cost_per_M__c,0),2)

                },500)

            }
           }
//Pricing 
           //this is a reuable functions for pricing and line totals
           appTotal = (t, nxt)=> roundNum((t+nxt),2); 
           
           newPrice(e){
                window.clearTimeout(this.delay);
                let index = this.data.findIndex(prod => prod.Id === e.target.name);
                let targetId = e.target.name; 
                
                this.delay = setTimeout(()=>{
                    this.data[index].Unit_Price__c = Number(e.detail.value);
                    //this.data[index].Unit_Price__c = Number(this.data[index].Unit_Price__c);
                    //console.log(typeof this.data[index].Unit_Price__c +' unit Type');          
                        
                        if(this.data[index].Unit_Price__c > 0 && this.data[index].Unit_Area__c != '100 Gal'){
                        console.log('unit price')
                        this.data[index].Margin__c = roundNum((1 - (this.data[index].Unit_Cost__c /this.data[index].Unit_Price__c))*100, 2);
                        this.data[index].Total_Price__c = roundNum(this.data[index].Units_Required__c * this.data[index].Unit_Price__c, 2);
                        let costs = perProduct(this.data[index].Total_Price__c, this.data[index].Product_Size__c, this.data[index].Rate2__c, this.data[index].Unit_Area__c);
                        let prodCost = pricePerUnit(this.data[index].Unit_Price__c, this.data[index].Product_Size__c, this.data[index].Rate2__c,this.data[index].Unit_Area__c);
                        this.data[index].Cost_per_M__c = prodCost.perThousand;
                        this.data[index].Cost_per_Acre__c = prodCost.perAcre;

                        this.prodCostM = prodCost.perThousand;
                        this.prodCostA = prodCost.perAcre;
                        this.prodAreaCost = this.areaAcres * this.costPerAcre; 
                    }else if(this.data[index].Unit_Price__c > 0 && this.data[index].Unit_Area__c === '100 Gal'){
                        let {Rate2__c, Product_Size__c, Spray_Vol_M__c} = this.data[index];

                        this.data[index].Margin__c = roundNum((1 - (this.data[index].Unit_Cost__c /this.data[index].Unit_Price__c))*100,2)
    
                        if(Spray_Vol_M__c>0 && Rate2__c> 0){
                            let finished = lowVolume(Rate2__c, Product_Size__c, Spray_Vol_M__c, this.data[index].Unit_Price__c) 
                       
                           //updateValues
                            this.data[index].Units_Required__c = lvUnits(this.areaSizeM, Spray_Vol_M__c, Product_Size__c, Rate2__c);
                            this.data[index].Total_Price__c = roundNum(this.data[index].Units_Required__c * this.data[index].Unit_Price__c, 2); 
       
                            this.data[index].Cost_per_M__c = finished.singleThousand;
                            this.data[index].Cost_per_Acre__c = finished.singleAcre;
                            this.prodCostM = finished.singleThousand;;
                            this.prodCostA = finished.singleAcre;
                            //this.prodAreaCost = this.areaAcres * this.costPerAcre;
                            
                            this.appTotalPrice = appTotal(this.data); 
                            this.totalCostPerM = roundNum(Object.values(this.data).reduce((t,{Cost_per_M__c})=>t+Cost_per_M__c,0),2)
                       }
                    }else{
                        this.data[index].Margin__c = 0;                
                        this.data[index].Margin__c = roundNum(this.data[index].Margin__c, 2);
                        this.data[index].Total_Price__c = roundNum(this.data[index].Units_Required__c * this.data[index].Unit_Price__c, 2);
                        let costs = perProduct(this.data[index].Total_Price__c, this.data[index].Product_Size__c, this.data[index].Rate2__c, this.data[index].Unit_Area__c);
                        let prodCost = pricePerUnit(this.data[index].Unit_Price__c, this.data[index].Product_Size__c, this.data[index].Rate2__c,this.data[index].Unit_Area__c);
                        
                        this.data[index].Cost_per_M__c = prodCost.perThousand;
                        this.data[index].Cost_per_Acre__c = prodCost.perAcre;
                        this.prodCostM = prodCost.perThousand;
                        this.prodCostA = prodCost.perAcre;
                        this.prodAreaCost = this.areaAcres * this.costPerAcre;

                    }
                    this.appTotalPrice = appTotal(this.data);
                    this.totalCostPerM = roundNum(Object.values(this.data).reduce((t,{Cost_per_M__c})=>t+Cost_per_M__c,0),2)
                    
                    let floor = Number(this.data[index].floorPrice)
                    let unitPrice = this.data[index].Unit_Price__c
                    this.handleWarning(targetId, floor, unitPrice, index)
                    }, 1000)
           }
           newMargin(m){
                window.clearTimeout(this.delay)
                    let index = this.data.findIndex(prod => prod.Id === m.target.name)
                    // eslint-disable-next-line @lwc/lwc/no-async-operation
                    this.delay = setTimeout(()=>{
                            this.data[index].Margin__c = Number(m.detail.value);
                            if(1- this.data[index].Margin__c/100 > 0 && this.data[index].Unit_Area__c != '100 Gal'){
                                this.data[index].Unit_Price__c = roundNum(this.data[index].Unit_Cost__c /(1- this.data[index].Margin__c/100), 2)
                                this.data[index].Total_Price__c = roundNum(this.data[index].Units_Required__c * this.data[index].Unit_Price__c, 2)
                                let costs = perProduct(this.data[index].Total_Price__c, this.data[index].Product_Size__c, this.data[index].Rate2__c, this.data[index].Unit_Area__c);
                                let prodCost = pricePerUnit(this.data[index].Unit_Price__c, this.data[index].Product_Size__c, this.data[index].Rate2__c,this.data[index].Unit_Area__c);
                                
                                this.data[index].Cost_per_M__c = prodCost.perThousand;
                                this.data[index].Cost_per_Acre__c = prodCost.perAcre; 
                                this.prodCostM = prodCost.perThousand;
                                this.prodCostA = costs.perAcre;
                                this.prodAreaCost = this.areaAcres * this.costPerAcre;
                                                           
                            }else if(1- this.data[index].Margin__c/100 > 0 && this.data[index].Unit_Area__c === '100 Gal'){
                                let {Rate2__c, Product_Size__c, Spray_Vol_M__c} = this.data[index];
                                
                                this.data[index].Unit_Price__c = roundNum(this.data[index].Unit_Cost__c /(1- this.data[index].Margin__c/100),2);
                                
                                if(Spray_Vol_M__c>0 && Rate2__c> 0){
                                    let finished = lowVolume(Rate2__c, Product_Size__c, Spray_Vol_M__c, this.data[index].Unit_Price__c) 
                               
                                   //updateValues
                                    this.data[index].Units_Required__c = lvUnits(this.areaSizeM, Spray_Vol_M__c, Product_Size__c, Rate2__c);
                                    this.data[index].Total_Price__c = roundNum(this.data[index].Units_Required__c * this.data[index].Unit_Price__c, 2); 
               
                                    this.data[index].Cost_per_M__c = finished.singleThousand;
                                    this.data[index].Cost_per_Acre__c = finished.singleAcre;
                                    this.prodCostM = finished.singleThousand;;
                                    this.prodCostA = finished.singleAcre;
                                    //this.prodAreaCost = this.areaAcres * this.costPerAcre;
                                    
                                    this.appTotalPrice = appTotal(this.data); 
                                    this.totalCostPerM = roundNum(Object.values(this.data).reduce((t,{Cost_per_M__c})=>t+Cost_per_M__c,0),2)
                               }
                            }else{
                                this.data[index].Unit_Price__c = 0;
                                this.data[index].Unit_Price__c = this.data[index].Unit_Price__c.toFixed(2);
                                this.data[index].Total_Price__c = roundNum(this.data[index].Units_Required__c * this.data[index].Unit_Price__c, 2);
                                let costs = perProduct(this.data[index].Total_Price__c, this.data[index].Product_Size__c, this.data[index].Rate2__c, this.data[index].Unit_Area__c);
                                let prodCost = pricePerUnit(this.data[index].Unit_Price__c, this.data[index].Product_Size__c, this.data[index].Rate2__c,this.data[index].Unit_Area__c);
                               
                                this.data[index].Cost_per_M__c = prodCost.perThousand;
                                this.data[index].Cost_per_Acre__c = prodCost.perAcre;
                                this.prodCostM = prodCost.perThousand;
                                this.prodCostA = prodCost.perAcre;
                                this.prodAreaCost = this.areaAcres * this.costPerAcre;    
                            }
                            this.appTotalPrice = appTotal(this.data); 
                            this.totalCostPerM = roundNum(Object.values(this.data).reduce((t,{Cost_per_M__c})=>t+Cost_per_M__c,0),2)
                },1500)
            }   
           

           //for the combo box 
           get unitArea(){
            return [
                {label:'OZ/M', value:'OZ/M'}, 
                {label: 'OZ/Acre', value:'OZ/Acre'},
                {label: 'LB/M', value:'LB/M'},
                {label: 'LB/Acre', value:'LB/Acre'},
                {label:'100 Gal', value:'100 Gal'}
            ];
        }
//Manual Charge specific info. If the rep is using a product that ATS does not carry this will allow them to set those values for name and size here

        manName(e){
            let index = this.data.findIndex(prod => prod.Id === e.target.name) 
            this.data[index].Note_Other__c = e.detail.value;             
        }
        manSize(e){
            let index = this.data.findIndex(prod => prod.Id === e.target.name) 
            this.data[index].Manual_Charge_Size__c = e.detail.value;
            this.data[index].Product_Size__c = Number(e.detail.value);
            if(this.data[index].Rate2__c > 0){
                this.data[index].Units_Required__c = unitsRequired(this.data[index].Unit_Area__c, this.data[index].Rate2__c, this.areaSize, this.data[index].Product_Size__c );
                this.appTotalPrice = appTotal(this.data); 
                this.totalCostPerM = roundNum(Object.values(this.data).reduce((t,{Cost_per_M__c})=>t+Cost_per_M__c,0),2)
            }    
        }
//handle note 
        prodNote(e){
            let index = this.data.findIndex(prod => prod.Product2Id === e.target.name) 
            this.data[index].Note__c = e.detail.value; 
        }

        removeProd(e){
            let index = this.data.findIndex(x => x.Product__c === e);
            
            if(index > -1){
                this.data.splice(index, 1)
            }
        }
        //handle select drop down on the products
    handleOnselect(event){
        let choice = event.detail.value;
        console.log(event.target.name);
        
        switch(choice){
            case 'Note':
                 this.data.find((x)=>x.Product__c === event.target.name).showNote = true;
                 this.data.find((x)=>x.Product__c === event.target.name).btnValue = 'Stash';
                 this.data.find((x)=>x.Product__c === event.target.name).btnLabel = 'Hide Note';
                break;
            case 'Delete':
                let prodName = event.target.name; 
                this.removeProd(prodName);
                break;
            case 'Stash':
                this.data.find((e)=>e.Product__c === event.target.name).showNote = false;
                this.data.find((x)=>x.Product__c === event.target.name).btnValue = 'Note';
                this.data.find((x)=>x.Product__c === event.target.name).btnLabel = 'Add Note';
                break;
            default:
                console.log('no choice');
                
        }
    }
    newAppNote(event){
        this.oppNote = event.detail.value
    }
           //flow
           @api
           save(){
               
               this.loaded = false; 
               let note = this.oppNote.length > 0 ? this.oppNote : '';
               this.dispatchEvent(new CustomEvent('save',{
                    detail: [this.data, note, this.isDropShip]
               }));    
               //this.loaded = true; 
               return true;
           }

//Update Pricing and Fertility info displayed to per M or per Acre
           updateMeasure(){
            this.measure = this.measure === 'M' ? 'Acre' : 'M';
           }

           cancel(){
               this.dispatchEvent(new CustomEvent('cancel'))
           }

        //handle price warnings
        handleWarning = (targ, flr, price, ind)=>{
            if(this.isDropShip){
                return;
            }else{
                if(price>=flr){        
                    this.template.querySelector(`[data-id="${targ}"]`).style.color ="black";
                    this.template.querySelector(`[data-margin="${targ}"]`).style.color ="black";
                    this.data[ind].goodPrice = true; 
                   
                }else if(price<flr){
                    this.template.querySelector(`[data-id="${targ}"]`).style.color ="red";
                    this.template.querySelector(`[data-margin="${targ}"]`).style.color ="red";
                    this.data[ind].goodPrice = false;
                }
                //seems backward but using a disable btn on the productTable. So if it's bad I need to return a true so the button is disabled. 
                this.goodPricing = checkPricing(this.data) === true ? false : true;
                
                    this.dispatchEvent(new CustomEvent('price',{
                        detail: this.goodPricing
                    })); 
            }
        }
priceBookName
        hiMouse(e){
            this.showProdInfo = true; 
            let index = this.data[e.target.dataset.code];
            //console.log(index);
            this.productName = index.Product_Name__c;
            this.productCost = index.agency ? 'Agency' : index.Unit_Cost__c;
            this.priceBookName = index.altPriceBookName__c;
            this.levelOne = index.levelOne;
            this.levelTwo = index.levelTwo;
            this.prodFloor = index.floorPrice; 
            this.prodCostM =  index.Cost_per_M__c ? index.Cost_per_M__c : perProduct(index.Total_Price__c, index.Product_Size__c, index.Rate2__c, index.Unit_Area__c).perThousand;
            this.prodCostA =  index.Cost_per_Acre__c ? index.Cost_per_Acre__c : perProduct(index.Total_Price__c, index.Product_Size__c, index.Rate2__c, index.Unit_Area__c).perAcre;
            this.treatedAcreage = index.Acres_Treated__c;
            this.prodN = index.N__c;
            this.prodP = index.P__c;
            this.prodK = index.K__c; 
        }
isDropShip = false; 
        handleDropShip(evt){
            evt.preventDefault();
            this.isDropShip = evt.target.checked;
            if(this.isDropShip && this.goodPricing){
                this.dispatchEvent(new CustomEvent('price',{
                    detail: false
                }));
            }
        }
}