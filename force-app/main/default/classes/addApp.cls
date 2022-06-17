public with sharing class addApp {
    @AuraEnabled 
      public static Application__c addApplication(appWrapper wrapper){
          Application__c app = new Application__c(); 
          app.Name = wrapper.appName; 
          app.Area__c = wrapper.appArea;
          app.Date__c = date.valueof(wrapper.appDate); 
          insert app; 
          return app; 
      }
      @AuraEnabled
      public static List<Application_Product__c> addProducts(string products){
           List<Application_Product__c> prodList = new List<Application_Product__c>(); 
          JSONParser parser = JSON.createParser(products); 
          while(parser.nextToken() != null){
              if(parser.getCurrentToken() == JSONToken.START_ARRAY){
                  while(parser.nextToken() != null){
                      //system.debug('current name' + parser.getCurrentName() + ' current token' + parser.getCurrentToken());
                      if(parser.getCurrentToken() == JSONToken.START_OBJECT){
                          application_product__c ap = new application_product__c();
                          application_product__c temp = (application_product__c)parser.readValueAs(application_product__c.class);
                          system.debug('temp ' + temp);
                          if(temp.Application__c != null){
                             //ap.Id = temp.Id;
                             ap.Product__c = temp.Product__c;
                             ap.Application__c = temp.Application__c; 	
                             ap.Rate2__c = temp.Rate2__c;
                             ap.Note__c = temp.Note__c; 
                             ap.Unit_Area__c = temp.Unit_Area__c;
                             ap.Unit_Price__c = temp.Unit_Price__c; 
                             ap.Margin__c = temp.Margin__c; 
                              //system.debug('product id '+ ap.Product__c);
                              prodList.add(ap);
                          }
                         
                          parser.skipChildren();
                      }
                  }
              }   
          } 
          if(!prodList.isempty()){
              insert prodList; 
          }
          return null;  
      }
      //Updates applications
      //the Area update is not in this iteration
      @AuraEnabled 
      public static Application__c updateApplication(appWrapper wrapper, string id){
          Application__c app = [select Name, Area__c, Date__c from Application__c where id =: id]; 
          system.debug('wrapper '+ wrapper + ' id '+id);
          system.debug('app '+ app);
          if(app.Name	!= wrapper.appName || app.date__c != wrapper.appDate){
              app.Name = wrapper.appName;
              app.Date__c = wrapper.appDate; 
             // app.Area__c = wrapper.appArea; 
          }
          system.debug('app name '+app.Name);
          update(app); 
          return app; 
          
      }
      //upsert products
      @AuraEnabled
      public static string updateProducts(List<App_Product__c> products){
          List<App_Product__c> toInsert = new List<App_Product__c>();
          system.debug(products);
          for(App_Product__c x : products){
              App_Product__c li = new App_Product__c();
              if(String.isBlank(x.Id)){
                  system.debug('new product '+x.Application__c);
                  li.Product__c = x.Product__c;
                  li.Rate2__c = x.Rate2__c;
                  li.Application__c = x.Application__c;
                  li.Units_Required__c = x.Units_Required__c;
                  li.Unit_Area__c = x.Unit_Area__c;
                  li.Unit_Price__c = x.Unit_Price__c;
                  li.Margin__c = x.Margin__c;
                  li.Unit_Cost__c = x.Unit_Cost__c; 
                  //toInsert.add(li);
              }else{
                  li.Id = x.Id; 
                  //li.Application__c = x.Application__c;
                  li.Rate2__c = x.Rate2__c;
                  li.Unit_Area__c = x.Unit_Area__c;
                  li.Units_Required__c = x.Units_Required__c;
                  li.Unit_Price__c = x.Unit_Price__c;
                  li.Margin__c = x.Margin__c;
                  li.Unit_Cost__c = x.Unit_Cost__c;
              }
              toInsert.add(li);
          }
          string mess; 
          try{
              Database.UpsertResult[] res = Database.upsert(toInsert);
              mess = 'success';
          }catch(exception x){
              mess = string.valueOf(x);
          }
          
          return mess; 
      }
      
      @AuraEnabled
      public static void multiInsert(id appId, integer occurance, integer daysBetween){
          list<Application__c> appsToInsert = new list<application__c>();
          list<Application_Product__c> prodsToInsert = new list<Application_Product__c>();
          integer appNumber = 1; 
         system.debug('occ '+occurance+' db '+ daysBetween);
          //get orginial app
          application__c app = [select id, area__c, name,
                                 date__c from application__c 
                                 where id =:appId];
          system.debug('app '+ app);
          list<Application_Product__c> ogProd = [select id, product__c, rate2__c, 
                                                 Unit_Area__c,Unit_Price__c from 
                                                Application_Product__c where Application__c =: appId];
        system.debug('ogProd '+ogProd);
          for(integer i = 1; i<= occurance; i++){
              integer days = daysBetween * i;
              application__c clonedApp = app.clone(false); 
              clonedApp.prev_app_id__c = appId; 
              clonedApp.date__c = app.date__c.addDays(days); 
              clonedApp.clone__c = True; 
              appNumber += 1; 
              clonedApp.name = app.name +' '+ appNumber;  
              
              appsToInsert.add(clonedApp); 
  
          }
          try{
              Database.SaveResult[] srList = Database.insert(appsToInsert, false);
              system.debug('apps inserted '+srList); 
              for(Database.SaveResult sr :srList){
                  id newApp = sr.getId();
                  system.debug('id '+newApp);
                  
                  for(application_Product__c ap: ogProd){
                      Application_Product__c x = new Application_Product__c();
                      x.Application__c = newApp;
                      x.Product__c = ap.Product__c;
                      x.Rate2__c = ap.Rate2__c;
                      x.Unit_Area__c = ap.Unit_Area__c;
                      x.Unit_Price__c = ap.Unit_Price__c;
                      prodsToInsert.add(x);
                  }
              }
              system.debug('prodsToInsert '+ prodsToInsert);
              Database.SaveResult[] products = Database.insert(prodsToInsert, false); 
          }catch(exception e){
              system.debug(e.getMessage());
          }
               //return null; 
      }
  
  }