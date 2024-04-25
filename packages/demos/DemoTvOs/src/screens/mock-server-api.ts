export class MockServerAPI {
  static selectExperience = (title: string): void => {
    const mockServerURL = 'http://localhost:4202/setOpportunityConfig';
    const requestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fileName: title,
        status: 200
      })
    };
    fetch(mockServerURL, requestInit)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        console.log(`Experience ${title} selected successfully`);
      })
      .catch((error) => {
        console.error(`Experience selection failed: ${error}`);
      });
  };
}
