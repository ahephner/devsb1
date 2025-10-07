@isTest
private class test_addApp {
  static Area__c area = new Area__c();
  static Program__c prog = new Program__c();
  static Product2 r1 = new Product2();
  static Product2 r2 = new Product2();  
  static Application__c Application = new Application__c();
  static Application__c followUp = new Application__c();
  static Date myDate = Date.newInstance(2040, 1, 4);
    static{
        //pricebook
        Id pricebookId = Test.getStandardPricebookId();
        //product 
         r1.Name='Product 1';
         r1.Primary_Category__c = 'Chemicals';
         r1.Subcategory__c ='Fungicide';
         r1.Include_in_Programs__c = True;
         r1.IsActive= True; 
         r1.ProductCode='123';
         r1.Product_Status__c ='Stock';
         r1.Size__c = 1;
         r1.Floor_Type__c ='Floor'; 
         r1.Floor_Price__c = 100;
         
         r2.Name='Product 2';
         r2.Primary_Category__c = 'Chemicals';
         r2.Subcategory__c = 'Fungicide';
         r2.Include_in_Programs__c = True;
         r2.IsActive= True; 
         r2.ProductCode='123';
         r2.Product_Status__c ='Stock';
         r2.Size__c = 1;
         r2.Floor_Type__c ='Floor'; 
         r2.Floor_Price__c = 100;
     	insert r1; 
     	insert r2;
        
        //pricebook entries
        PricebookEntry pbe = new PricebookEntry(Pricebook2Id = pricebookId, Product2Id=r1.id,
                                                 unitprice=100, IsActive = True, UseStandardPrice=False);
        PricebookEntry pbe2 = new PricebookEntry(Pricebook2Id = pricebookId, Product2Id=r2.id,
                                                 unitprice=100, IsActive = True, UseStandardPrice=False);
		insert pbe;
        insert pbe2;
        

        
        // setup a new account
    Account cust = new Account();
    cust.Name = 'Test123456';
    cust.Type = 'Customer';
    cust.Customer_Name__c = 'Test Customer 123456';
    insert cust;
      
    // create new program
    Program__c prog = new Program__c();
    prog.Name = 'Test Program 2018';
    prog.Account__c = cust.Id;
    insert prog;
    
    // create new area
    area.Name = 'Greens';
    area.Program__c = prog.Id;
    area.Area_Acres__c = 1000;
    insert area;
     
    Application.Name = 'test app';
    Application.Area__c = area.id; 
    Application.Date__c = myDate; 
    Application.Parent_Application__c = true;
    insert Application;
    
    //Follow up for mass update info
    //need to also add products that match what is on the original app

    followUp.Name = 'test app 2';
    followUp.Area__c = area.id; 
    followUp.Date__c = myDate+1; 
    followUp.Parent_Application__c = true;
    followUp.Prev_App_Id__c = Application.Id; 
 	insert followUp;
        
    //insert app product
    App_Product__c ap1 = new App_Product__c(Application__c = Application.Id, Product__c= r1.id, Oz_M__c =1,Unit_Price__c = 100);
    App_Product__c ap2 = new App_Product__c(Application__c = Application.Id, Product__c= r2.id, Oz_M__c =1,Unit_Price__c = 100);    
        insert ap1;
        insert ap2; 
    }
    //create app wrapper and test insert new app NOTE the appWrapper is in it's own page appWrapper.apxc You can add other details required for capturing info
    //required on the app there then add it below in the test class. Example, if you wanted to get Boolean was it applied? On the file page add Boolean applied get;set;
    //then below add x.applied   true or false 	
    @isTest
    static void testappWrapper(){
       appWrapper x = new appWrapper();
	   x.appName = 'test';
       x.appDate = system.today();
       x.appArea = area.id; 
       x.parentApp = false; 
       x.ds = false; 
      Test.startTest(); 
        application__c newApp = addApp.addApplication(x);
      Test.stopTest(); 
        application__c i = [select name from application__c where name =: x.appName];
        system.debug('here is i '+i);
        system.assertEquals(x.appName, i.name); 
    }

 //test update application 
    @isTest
    static void testUpdateApplication(){
       appWrapper x = new appWrapper();
	   x.appName = 'test';
       x.appDate = system.today();
       x.appArea = area.id; 
       x.appNote = 'I am a note';
        x.ds = true; 
       boolean newNote = true; 
        Test.startTest();
        	Application__c upApp = addApp.updateApplication(x, Application.Id, newNote);
        Test.stopTest(); 
    }
    
    //test updating product list 
    @isTest
    static void testUpdateProducts(){
        //create and insert new application products
        App_Product__c ap3 = new App_Product__c(Application__c=application.Id,Product__c = r1.Id, Rate2__c =2,Units_Required__c = 2,
                                                OZ_M__c = 3, Note__c ='', Unit_Area__c = 'OZ/M',Unit_Price__c = 12,Margin__c =13,
                                                isLowVol__c = true, Spray_Vol_M__c = 1,Acres_Treated__c=1,
                                               Unit_Cost__c = 2,N__c = 0, P__c=0, K__c=0, Note_Other__c='none', Manual_Charge_Size__c=1,
                                               Cost_per_Acre__c=1,Cost_per_M__c=1,altPriceBookName__c='Name', altPriceBookId__c='2333', altPriceBookEntryId__c='3213');
        	insert ap3;
        //update above
        list<App_Product__c> updates = new list<App_Product__c>();     
        App_Product__c up3 = [select id, Product__c, Rate2__c, Application__c, Units_Required__c, Unit_Area__c, Unit_Price__c,Cost_per_100__c,Cost_per_Gallon__c,
                              		Margin__c, Unit_Cost__c, Note__c, N__c, P__c, K__c,Note_Other__c, Manual_Charge_Size__c,isLowVol__c, Total_Price__c,Product_Cost__c,
                              		Spray_Vol_M__c, Acres_Treated__c, Cost_per_Acre__c, Cost_per_M__c, altPriceBookName__c, altPriceBookId__c, altPriceBookEntryId__c from App_Product__c where id = :ap3.Id];
        	up3.OZ_M__c = 5;
        	App_Product__c ap4 = new App_Product__c(Application__c=application.Id,Product__c = r2.Id, Rate2__c =2,Units_Required__c = 2,Cost_per_100__c=1,Cost_per_Gallon__c=1,
                                                OZ_M__c = 3, Note__c ='', Unit_Area__c = 'OZ/M',Unit_Price__c = 12,Margin__c =13,Acres_Treated__c=1,
                                               Unit_Cost__c = 2,N__c = 0, P__c=0, K__c=0, Note_Other__c='ne', Manual_Charge_Size__c=1,
                                               Cost_per_Acre__c=10, Cost_per_M__c=5,altPriceBookName__c='Name', altPriceBookId__c='2333', altPriceBookEntryId__c='3213',
                                               isLowVol__c = false, Spray_Vol_M__c = 0);
        		updates.add(up3);
        		updates.add(ap4);
        

        Test.startTest(); 
        	string prodList = addApp.updateProducts(updates);
        Test.stopTest();

    }
    //test multi-insert
    @isTest 
    static void testMultiInsert(){
        integer occ = 2;
        integer db= 3; 
        App_Product__c ap1 = new App_Product__c(Application__c=Application.Id,product__c = r1.id, 
                                                                Rate2__c = 1,Unit_Area__c = 'OZ/M', Note__c ='');
        App_Product__c ap2 = new App_Product__c(Application__c=Application.Id, product__c = r2.id,
                                                                Rate2__c = 2,Unit_Area__c='LB/M',  Note__c ='');
        insert ap1;
        insert ap2; 
        
        Test.startTest();
         addApp.multiInsert(Application.Id, occ, db); 
        Test.stopTest();
    }
//test inserting json product list
    @isTest
    static void testAddProducts(){
       list<App_Product__c> apList = new list<App_Product__c>(); 
        App_Product__c ap1 = new App_Product__c(Application__c=application.Id,product__c = r1.id, 
                                                                Rate2__c = 1,Unit_Area__c = 'OZ/M', Note__c ='');
       App_Product__c ap2 = new App_Product__c(Application__c=application.Id, product__c = r2.id,
                                                                Rate2__c = 2,Unit_Area__c='LB/M',  Note__c ='');
 
        apList.add(ap1);
        apList.add(ap2);

        String myJSON = JSON.serialize(apList); 
        
        Test.startTest(); 
        	list<App_Product__c> prodList = addApp.addProducts(myJson);
        Test.stopTest(); 
        	list<App_Product__c> c = [select id from App_Product__c where application__c =: application.Id];
        	system.assertEquals(4, c.size()); 
    }
    
    //testing updates
        @isTest 
    static void testmultiUpdateProd(){
        list<string> prodId = new list<string>();
        prodId.add(r1.id);
        prodId.add(r2.id);
        

        App_Product__c ap1 = new App_Product__c(Application__c=Application.Id,product__c = r1.id, 
                                                                Rate2__c = 1,Unit_Area__c = 'OZ/M', Note__c ='');
        App_Product__c ap2 = new App_Product__c(Application__c=followUp.Id,product__c = r1.id, 
                                                                Rate2__c = 1,Unit_Area__c = 'OZ/M', Note__c ='');
        insert ap1;
        insert ap2; 
         
        Test.startTest();
        	addApp.multiUpdateProd(prodId,Application.Date__c, Application.Id, Application.Id, true, 'series', area.Id, prog.Id);
        	addApp.multiUpdateProd(prodId,Application.Date__c, followUp.Id, followUp.Id, false, 'series', area.Id, prog.Id);
        	addApp.multiUpdateProd(prodId,Application.Date__c, Application.Id, Application.Id, true, 'area', area.Id, prog.Id); 
        	addApp.multiUpdateProd(prodId,Application.Date__c, Application.Id, Application.Id, true, 'program', area.Id, prog.Id); 
        Test.stopTest();
    }
}