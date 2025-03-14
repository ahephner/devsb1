@isTest
public class test_appWeather {
	@isTest
    static void test_getWeatherInfo(){
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
        
        test.StartTest();
        list<Program__c> pro = appWeather.getWeatherInfo(prog.Id); 
        test.StopTest();
    }
    	@isTest
    static void test_getAddressInfo(){
        string address = '502 Heller St, Montpelier, OH 43543 USA'; 
        
        test.startTest();
        	Map<String, Object> infoBack = appWeather.getAddressInfo(address); 
        test.stopTest();
    }
}