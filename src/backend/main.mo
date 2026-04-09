import Text "mo:core/Text";
import Blob "mo:core/Blob";
import Error "mo:core/Error";
import Map "mo:core/Map";

actor {
  // Storage: testId -> (deviceId, results)
  let testDataStore = Map.empty<Text, (Text, Text)>();

  // IC management canister HTTP outcall types
  type HttpHeader = { name : Text; value : Text };
  type HttpMethod = { #get; #head; #post };
  type TransformArgs = { response : HttpRequestResult; context : Blob };
  type HttpRequestResult = {
    status : Nat;
    headers : [HttpHeader];
    body : Blob;
  };
  type HttpRequestArgs = {
    url : Text;
    max_response_bytes : ?Nat64;
    method : HttpMethod;
    headers : [HttpHeader];
    body : ?Blob;
    transform : ?{
      function : shared query TransformArgs -> async HttpRequestResult;
      context : Blob;
    };
    is_replicated : ?Bool;
  };

  // IC management canister interface for HTTP outcalls
  let ic = actor "aaaaa-aa" : actor {
    http_request : HttpRequestArgs -> async HttpRequestResult;
  };

  // Transform function strips headers to ensure consensus across replicas
  public query func transform(args : TransformArgs) : async HttpRequestResult {
    { args.response with headers = [] };
  };

  /// Fetches test data for a given testId via HTTP outcall.
  /// Uses a placeholder endpoint; real 5G endpoint can be substituted.
  public func fetchTestData(testId : Text) : async Text {
    let url = "https://jsonplaceholder.typicode.com/posts/1?testId=" # testId;
    let request : HttpRequestArgs = {
      url = url;
      max_response_bytes = ?16_384;
      method = #get;
      headers = [{ name = "Accept"; value = "application/json" }];
      body = null;
      transform = ?{
        function = transform;
        context = Blob.fromArray([]);
      };
      is_replicated = null;
    };
    try {
      let response = await ic.http_request(request);
      switch (response.body.decodeUtf8()) {
        case (?text) text;
        case null "Error: response body is not valid UTF-8";
      };
    } catch (e) {
      "Error fetching test data: " # e.message();
    };
  };

  /// Stores deviceId and results keyed by testId.
  public func setTestData(testId : Text, deviceId : Text, results : Text) : async () {
    testDataStore.add(testId, (deviceId, results));
  };

  /// Retrieves (deviceId, results) for a given testId.
  public func getTestData(testId : Text) : async ?(Text, Text) {
    testDataStore.get(testId);
  };

  /// Triggers the HTTP outcall for the given testId and returns the raw response.
  public func startFetching(testId : Text) : async Text {
    await fetchTestData(testId);
  };
};
