// Use .apex files to store anonymous Apex.
// You can execute anonymous Apex in VS Code by selecting the
//     apex text and running the command:
//     SFDX: Execute Anonymous Apex with Currently Selected Text
// You can also execute the entire file by running the command:
//     SFDX: Execute Anonymous Apex with Editor Contents

string tempvar = 'Enter_your_name_here';
System.debug('Hello World!');
System.debug('My name is ' + tempvar);

for(string x:priceBookIds){
              priorityPrice = [select Id, Pricebook2Id,Pricebook2.Name,Pricebook2.IsStandard,Pricebook2.Priority__c, List_Margin__c, Product2Id,Cost_Has_Decreased__c, 
                                          UnitPrice, Floor_Price__c,Hold_Margin__c, Level_1_UserView__c,Level_One_Margin__c, Level_2_UserView__c,Level_2_Margin__c,Floor_Margin__c,
                                          Product_Cost__c, Sub_Cat__c, List_Margin_Calculated__c, Product2.ERP_Name__c from PricebookEntry 
                                          where IsActive = true and Pricebook2Id =:x and Product2ID=: productId];  
             
            if(priorityPrice.size()==0){
            
                continue; 
            }else{
                break;
            }
        }