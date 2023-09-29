import express from "express";
import { User } from "../models/user";
import jwt from "jsonwebtoken";
import { verifyJwt } from "../middleware/verifyJwt";
import { z } from "zod";
const router = express.Router();

const signUpSchema = z
  .object({
    username: z.string().min(7).max(20).email(),
    password: z.string().min(5, "Password must be atleast of length 5").max(20),
    confirmPassword: z.string().min(5).max(20),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password must match",
    path: ["confirmPassword"],
  });

type TsignUpSchema = z.infer<typeof signUpSchema>;
router.post("/signup", async (req, res) => {
  const body = await req.body;
  const result = signUpSchema.safeParse(body);
  let zodErrors = {};
  if (!result.success) {
    result.error.issues.forEach((issue) => {
      zodErrors = { ...zodErrors, [issue.path[0]]: issue.message };
    });
  }

  res.json(
    Object.keys(zodErrors).length > 0
      ? { errors: zodErrors }
      : { success: true }
  );
});

// router.post('/signup', async(req,res)=> {
//     try{
//         const parsedInput= signupInput.safeParse(req.body);
//         if(!parsedInput.success){
//             return res.status(411).json({
//                 msg: parsedInput.error
//             })
//         }
//         const username= parsedInput.data.username;
//         const password= parsedInput.data.password;
//         const user= await User.findOne({username: username})

//         if(user){
//            return  res.json({message: 'user already exists!'})
//         }else{
//             const newUser= new User({username,password});
//             await newUser.save();
//             if(!process.env.SECRET_KEY){
//                 return res.sendStatus(403);
//             }
//             const token = jwt.sign({id: newUser._id}, process.env.SECRET_KEY, {expiresIn: '1h'});
//             res.json({message: "SignedUp successfully", token})
//         }

//     }catch(err){
//         console.log(err);
//     }
// });

router.post("/login", async (req, res) => {
  try {
    const { username } = req.body;
    const user = await User.findOne({ username: username });
    if (user) {
      if (!process.env.SECRET_KEY) {
        return res.sendStatus(403);
      }
      const token = jwt.sign({ id: user._id }, process.env.SECRET_KEY, {
        expiresIn: "1h",
      });
      return res.json({ message: "Logged in successfully", token });
    } else {
      return res.json({ message: "User does not exists" });
    }
  } catch (err) {
    console.log(err);
  }
});

router.get("/me", verifyJwt, async (req, res) => {
  try {
    const userId = req.headers["userId"];
    const user = await User.findById(userId);
    if (!user) {
      return res.sendStatus(403);
    }
    const username = user.username;
    res.json(username);
  } catch (err) {
    console.log("puppu");
    console.log(err);
  }
});


export default router;

// Output of const result= signUpSchema.safeParse(body); is written down :-

// {
//     "msg": {
//         "success": false,
//         "error": {
//             "issues": [
//                 {
//                     "code": "invalid_type",
//                     "expected": "string",
//                     "received": "undefined",
//                     "path": [
//                         "username"
//                     ],
//                     "message": "Required"
//                 },
//                 {
//                     "code": "too_small",
//                     "minimum": 5,
//                     "type": "string",
//                     "inclusive": true,
//                     "exact": false,
//                     "message": "String must contain at least 5 character(s)",
//                     "path": [
//                         "password"
//                     ]
//                 }
//             ],
//             "name": "ZodError"
//         }
//     }
// }
