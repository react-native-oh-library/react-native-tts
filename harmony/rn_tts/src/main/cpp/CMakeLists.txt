cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

set(rnoh_tts_generated_dir "${CMAKE_CURRENT_SOURCE_DIR}/generated")
file(GLOB_RECURSE rnoh_tts_generated_SRC "${rnoh_tts_generated_dir}/**/*.cpp")
file(GLOB rnoh_tts_SRC CONFIGURE_DEPENDS *.cpp)
add_library(rnoh_tts SHARED ${rnoh_tts_SRC} ${rnoh_tts_generated_SRC})
target_include_directories(rnoh_tts PUBLIC ${CMAKE_CURRENT_SOURCE_DIR} ${rnoh_tts_generated_dir} ${CMAKE_CURRENT_SOURCE_DIR}/generated/RNOH/generated)
target_link_libraries(rnoh_tts PUBLIC rnoh)