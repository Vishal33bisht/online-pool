import bcrypt from "bcrypt";
import prisma from "../config/prisma.js"
import generateToken from "../utils/generateToken.js";
import { success } from "zod";
import { tr } from "zod/v4/locales";

export const register=async (req,res)=>{
    try{
        const{name,email,password}=req.body;
        const existingUser=await prisma.user.findUnique({
            where:{
                email,
            },
        });
        if(existingUser){
            return res.status(409).json({
                success:false,
                message:"User already exists"
            });
        }
        const hashedPassword=await bcrypt.hash(password,10);

        const user=await prisma.user.create({
             data:{
                name,
                email,
                password:hashedPassword,
             },
        });

        const token=generateToken(user.id);
        res.cookie("token",token,{
            httpOnly:true,
            secure:false,
            sameSite:"lax",
            maxAge:7*24*60*60*1000,
        });

    return res.status(201).json({
        success:true,
        message:"User registered",
        user:{
        id:user.id,
        name:user.email,
        email:user.email,
    },
    });
    } catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"internal server error",
        });
    }
};

export const login=async(req,res)=>{
    try{
        const{email,password}=req.body;
        const user=await prisma.user.findUnique({
            where:{
                email,
            },
        });
        if(!user){
            return res.status(401).json({
                success:false,
                message:"Invalid credentials"
            });
        }

        const isMatch=await bcrypt.compare(
            password,
            user.password
        );
        if(!isMatch){
            return res.status(401).json({
                success:false,
                message:"Invalid Credentials",
            });
        }
        const token=generateToken(user.id);
        res.cookie("token",token,{
            httpOnly:true,
            secure:false,
            sameSite:"lax",
            message:7*24*60*60*1000,
        });
        return res.status(200).json({
            success:true,
            message:"login succesful",
            user:{
                id:user.id,
                name:user.name,
                email:user.email,
            }
        });
    }catch(err){
        console.log(err);
        return res.status(500).json({
            success:true,
            message:"Internal server error",
        });
    }
};

export const logout=async(req,re)=>{
      res.clearCookie("Token");
      return res.status(200).json({
        success:true,
        message:"logout done"
      });
}