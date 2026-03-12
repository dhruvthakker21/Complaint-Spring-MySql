package com.example.complaint_management.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

    @RestController
    @RequestMapping("/api/admin")
    @CrossOrigin
    public class AdminController {

        @PostMapping("/login")
        public ResponseEntity<String> adminLogin(@RequestBody Map<String,String> data){

            String username = data.get("username");
            String password = data.get("password");

            if(username.equals("admin") && password.equals("1234")){
                return ResponseEntity.ok("success");
            }

            return ResponseEntity.status(401).body("Invalid credentials");
        }
    }


