/**
 * MUST include "type":"module" in package.json
 */
 import fetch from 'cross-fetch';


function main() {

    const UserIdentity= "0xddbe5ae7e8bf58f24f8253fe9d3473392c61a8f1"

    const requestOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
          },
        body: JSON.stringify({
            identity:UserIdentity,
            type:"Result of job keyword_extraction"
        }),
    };

    
fetch('http://localhost:50051/get_collaborative_result', requestOptions)
        .then(response => response.json())
        .then(res=>{
            console.log(res)
            //append the states
            const newPosts=res["result"]["result"]
            const d=newPosts.map((res)=>{
                return {
                    ...res,
                    key:res.post_id
                }
            })
            this.setState({
                posts:[...this.state.posts,...d]
            })
        })
        .catch(err=>{console.log("oops",err)})

}
  
main()