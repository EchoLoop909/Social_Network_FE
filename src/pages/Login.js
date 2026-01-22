// import { useEffect } from "react";
// import { Spin } from "antd";
// import { useSelector } from "react-redux";
// import { useNavigate } from "react-router-dom";
// import { buildLoginUrl } from "../services/authApi";

// export const buildLoginUrl = () => {
//   const params = new URLSearchParams({
//     client_id: "SocialNetwork",
//     redirect_uri: "http://localhost:3000/oauth/callback",
//     response_type: "code",
//     scope: "openid profile email",
//   });

//   return `http://localhost:8080/realms/master/protocol/openid-connect/auth?${params}`;
// };