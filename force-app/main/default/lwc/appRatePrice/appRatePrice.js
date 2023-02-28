import { LightningElement, api, track } from 'lwc';
import {appTotal, calcDryFert, calcLiqFert, unitsRequired, roundNum} from 'c/programBuilderHelper';
import {checkPricing} from 'c/helper'
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
           @api 
           get selection(){
            return this.data;
           }
           //need to make this private so we can edit this
           set selection(value){
               this.data = JSON.parse(JSON.stringify(value)); 
                console.log('data ' +JSON.stringify(this.data));
                
           }

//user changes the rate for the product
           newRate(e){
            let index = this.data.findIndex(prod => prod.Id === e.target.name);
            
            window.clearTimeout(this.delay);
             // eslint-disable-next-line @lwc/lwc/no-async-operation
            this.delay = setTimeout(()=>{
                this.data[index].Rate2__c = e.detail.value;
                
                if(this.data[index].Unit_Area__c != '' && this.data[index].Unit_Area__c != null){
                    //console.log('uofm',this.data[index].Unit_Area__c,'rate', this.data[index].Rate2__c,'area size', this.areaSize,'product size', this.data[index].size)
                    this.data[index].Units_Required__c = unitsRequired(this.data[index].Unit_Area__c, this.data[index].Rate2__c, this.areaSize, this.data[index].size )    
                    this.data[index].Total_Price__c = roundNum(this.data[index].Units_Required__c * this.data[index].Unit_Price__c,2);
                    this.appTotalPrice = appTotal(this.data)
                    //console.log('info = '+this.data[index].Unit_Area__c, this.data[index].Rate2__c, this.areaSize, this.data[index].size);
                    if(this.data[index].isFert){
                        let fert = this.data[index].Product_Type__c === 'Dry' ? calcDryFert(this.data[index].Rate2__c, this.data[index]) : calcLiqFert(this.data[index].Rate2__c, this.data[index]);
                        
                        this.appTotalN = fert.n;
                        this.appTotalP = fert.p;
                        this.appTotalK = fert.k; 
                    } 
                }
                
            },500 ) 
           }

           handleUnitArea(e){
               let index = this.data.findIndex(prod => prod.Id === e.target.name);
               //console.log('index ' +index + ' detail '+e.detail.value );
               
               this.data[index].Unit_Area__c = e.detail.value;
               
               if(this.data[index].Rate2__c > 0){
                this.data[index].Units_Required__c = unitsRequired(this.data[index].Unit_Area__c, this.data[index].Rate2__c, this.areaSize, this.data[index].size );
                this.data[index].Total_Price__c = roundNum(this.data[index].Units_Required__c * this.data[index].Unit_Price__c, 2);
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
                    this.data[index].Unit_Price__c = e.detail.value;
                    //this.data[index].Unit_Price__c = Number(this.data[index].Unit_Price__c);
                    //console.log(typeof this.data[index].Unit_Price__c +' unit Type');          
                        
                        if(this.data[index].Unit_Price__c > 0){
                        console.log('unit price')
                        this.data[index].Margin__c = roundNum((1 - (this.data[index].Product_Cost__c /this.data[index].Unit_Price__c))*100, 2);
                        this.data[index].Total_Price__c = roundNum(this.data[index].Units_Required__c * this.data[index].Unit_Price__c, 2);
                    }else{
                        this.data[index].Margin__c = 0;                
                        this.data[index].Margin__c = roundNum(this.data[index].Margin__c, 2);
                        this.data[index].Total_Price__c = roundNum(this.data[index].Units_Required__c * this.data[index].Unit_Price__c, 2);

                    }
                    this.appTotalPrice = appTotal(this.data);
                    
                    let lOne = Number(this.data[index].levelOne)
                    let floor = Number(this.data[index].floorPrice)
                    let unitPrice = this.data[index].Unit_Price__c
                    this.handleWarning(targetId, lOne, floor, unitPrice, index)
                    }, 1000)
           }
           newMargin(m){
                window.clearTimeout(this.delay)
                    let index = this.data.findIndex(prod => prod.Id === m.target.name)
                    // eslint-disable-next-line @lwc/lwc/no-async-operation
                    this.delay = setTimeout(()=>{
                            this.data[index].Margin__c = Number(m.detail.value);
                            if(1- this.data[index].Margin__c/100 > 0){
                                this.data[index].Unit_Price__c = roundNum(this.data[index].Product_Cost__c /(1- this.data[index].Margin__c/100), 2)
                                this.data[index].Total_Price__c = roundNum(this.data[index].Units_Required__c * this.data[index].Unit_Price__c, 2)
                                this.appTotalPrice = appTotal(this.data);
                            console.log('margin if ' +this.appTotalPrice);
                            }else{
                                this.data[index].Unit_Price__c = 0;
                                this.data[index].Unit_Price__c = this.data[index].Unit_Price__c.toFixed(2);
                                this.data[index].Total_Price__c = roundNum(this.data[index].Units_Required__c * this.data[index].Unit_Price__c, 2);
                                this.appTotalPrice = appTotal(this.data); 
                                
                            }
                },1500)
            }   
           

           //for the combo box 
           get unitArea(){
            return [
                {label:'OZ/M', value:'OZ/M'}, 
                {label: 'OZ/Acre', value:'OZ/Acre'},
                {label: 'LB/M', value:'LB/M'},
                {label: 'LB/Acre', value:'LB/Acre'}
            ];
        }

        removeProd(e){
            let index = this.data.findIndex(x => x.Id === e.target.name);
            
            if(index > -1){
                this.data.splice(index, 1)
            }
        }
           //flow
           @api
           save(){
               
               this.loaded = false; 
               console.log('loaded '+this.loaded);
               
               this.dispatchEvent(new CustomEvent('save',{
                    detail: this.data
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
        handleWarning = (targ, lev, flr, price, ind)=>{
            //console.log(1,lev, 2, flr, 3, price, 4, targ);
            
            if(price > lev){        
                this.template.querySelector(`[data-id="${targ}"]`).style.color ="black";
                this.template.querySelector(`[data-margin="${targ}"]`).style.color ="black";
                this.data[ind].goodPrice = true; 
               
            }else if(price<lev && price>=flr){
                this.template.querySelector(`[data-id="${targ}"]`).style.color ="orange";
                this.template.querySelector(`[data-margin="${targ}"]`).style.color ="orange";
                this.data[ind].goodPrice = true;
                
            }else if(price===lev && price>=flr){
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