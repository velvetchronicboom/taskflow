
package com.example.taskflow.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HelloController {

    @GetMapping("/api/hello")
    public String hello() {
        System.out.println("Testing debug pointer");
        return "This was cool";
    }
}
